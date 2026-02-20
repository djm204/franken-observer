import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebhookNotifier } from './WebhookNotifier.js'
import { CircuitBreaker } from '../cost/CircuitBreaker.js'
import { LoopDetector } from '../incident/LoopDetector.js'

describe('WebhookNotifier', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' })
  })

  describe('send()', () => {
    it('POSTs to the configured URL', async () => {
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      await notifier.send({ type: 'test' })
      const [url] = mockFetch.mock.calls[0]
      expect(url).toBe('https://hooks.example.com/signal')
    })

    it('uses HTTP POST method', async () => {
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      await notifier.send({ type: 'test' })
      const [, init] = mockFetch.mock.calls[0]
      expect(init.method).toBe('POST')
    })

    it('sends Content-Type: application/json', async () => {
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      await notifier.send({ type: 'test' })
      const [, init] = mockFetch.mock.calls[0]
      expect(init.headers['Content-Type']).toBe('application/json')
    })

    it('serialises the payload as a JSON body', async () => {
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      await notifier.send({ type: 'circuit-breaker', spendUsd: 1.5, limitUsd: 1.0 })
      const [, init] = mockFetch.mock.calls[0]
      const body = JSON.parse(init.body as string)
      expect(body).toEqual({ type: 'circuit-breaker', spendUsd: 1.5, limitUsd: 1.0 })
    })

    it('merges custom headers with Content-Type', async () => {
      const notifier = new WebhookNotifier({
        url: 'https://hooks.example.com/signal',
        headers: { 'X-Api-Key': 'secret', Authorization: 'Bearer token' },
        fetch: mockFetch,
      })
      await notifier.send({ type: 'test' })
      const [, init] = mockFetch.mock.calls[0]
      expect(init.headers['Content-Type']).toBe('application/json')
      expect(init.headers['X-Api-Key']).toBe('secret')
      expect(init.headers['Authorization']).toBe('Bearer token')
    })

    it('custom headers can override Content-Type', async () => {
      const notifier = new WebhookNotifier({
        url: 'https://hooks.example.com/signal',
        headers: { 'Content-Type': 'application/vnd.custom+json' },
        fetch: mockFetch,
      })
      await notifier.send({ type: 'test' })
      const [, init] = mockFetch.mock.calls[0]
      expect(init.headers['Content-Type']).toBe('application/vnd.custom+json')
    })

    it('throws if the HTTP response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' })
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      await expect(notifier.send({ type: 'test' })).rejects.toThrow('500')
    })

    it('error message includes the status text', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' })
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      await expect(notifier.send({ type: 'test' })).rejects.toThrow('Forbidden')
    })

    it('rethrows if fetch itself rejects (network error)', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      await expect(notifier.send({ type: 'test' })).rejects.toThrow('ECONNREFUSED')
    })

    it('accepts any JSON-serialisable payload', async () => {
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      await notifier.send(['a', 'b', 'c'])
      const [, init] = mockFetch.mock.calls[0]
      expect(JSON.parse(init.body as string)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('integration with CircuitBreaker', () => {
    it('delivers a circuit-breaker payload via fire-and-forget wiring', async () => {
      // Resolve only once mockFetch is actually invoked so we don't rely on setTimeout
      let resolveOnDelivery!: () => void
      const delivered = new Promise<void>(r => (resolveOnDelivery = r))
      mockFetch.mockImplementation(async () => {
        resolveOnDelivery()
        return { ok: true, status: 200, statusText: 'OK' }
      })

      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      const breaker = new CircuitBreaker({ limitUsd: 1.0 })

      breaker.on('limit-reached', result => {
        void notifier.send({ type: 'circuit-breaker', ...result })
      })

      breaker.check(1.5) // trips the breaker
      await delivered

      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toBe('https://hooks.example.com/signal')
      const body = JSON.parse(init.body as string)
      expect(body.type).toBe('circuit-breaker')
      expect(body.tripped).toBe(true)
      expect(body.spendUsd).toBe(1.5)
    })

    it('does not fire when spend is below the limit', async () => {
      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      const breaker = new CircuitBreaker({ limitUsd: 5.0 })
      breaker.on('limit-reached', result => {
        void notifier.send({ type: 'circuit-breaker', ...result })
      })
      breaker.check(1.0) // below limit
      // Give the event loop a tick — no delivery should happen
      await new Promise(r => setTimeout(r, 0))
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('integration with LoopDetector', () => {
    it('delivers a loop-detected payload via fire-and-forget wiring', async () => {
      let resolveOnDelivery!: () => void
      const delivered = new Promise<void>(r => (resolveOnDelivery = r))
      mockFetch.mockImplementation(async () => {
        resolveOnDelivery()
        return { ok: true, status: 200, statusText: 'OK' }
      })

      const notifier = new WebhookNotifier({ url: 'https://hooks.example.com/signal', fetch: mockFetch })
      const detector = new LoopDetector({ windowSize: 2, repeatThreshold: 2 })

      detector.on('loop-detected', result => {
        void notifier.send({ type: 'loop-detected', ...result })
      })

      for (const name of ['a', 'b', 'a', 'b']) {
        detector.check(name)
      }
      await delivered

      const [, init] = mockFetch.mock.calls[0]
      const body = JSON.parse(init.body as string)
      expect(body.type).toBe('loop-detected')
      expect(body.detectedPattern).toEqual(['a', 'b'])
      expect(body.repetitions).toBe(2)
    })
  })
})
