import type { FetchFn } from '../adapters/langfuse/LangfuseAdapter.js'

export interface WebhookNotifierOptions {
  /** URL to POST the JSON payload to. */
  url: string
  /**
   * Additional HTTP headers merged on every request.
   * Content-Type is set to application/json by default and can be
   * overridden here.
   */
  headers?: Record<string, string>
  /** Injectable for testing. Defaults to globalThis.fetch. */
  fetch?: FetchFn
}

/**
 * Delivers HITL signals (CircuitBreaker, LoopDetector) to external systems
 * over HTTP. Any JSON-serialisable payload can be sent.
 *
 * send() throws on non-2xx responses and network errors. For fire-and-forget
 * use inside event handlers, suppress the rejection with `void`:
 *
 * ```ts
 * circuitBreaker.on('limit-reached', result => {
 *   void notifier.send({ type: 'circuit-breaker', ...result })
 *     .catch(err => console.error('webhook failed', err))
 * })
 * ```
 */
export class WebhookNotifier {
  private readonly url: string
  private readonly extraHeaders: Record<string, string>
  private readonly fetchFn: FetchFn

  constructor(options: WebhookNotifierOptions) {
    this.url = options.url
    this.extraHeaders = options.headers ?? {}
    this.fetchFn = options.fetch ?? (globalThis.fetch as unknown as FetchFn)
  }

  async send(payload: unknown): Promise<void> {
    const response = await this.fetchFn(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.extraHeaders,
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error(
        `Webhook delivery failed: ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
      )
    }
  }
}
