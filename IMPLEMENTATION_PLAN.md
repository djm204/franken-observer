# Implementation Plan — franken-observer (MOD-05)

> Methodology: TDD · Tracer Bullets · Atomic Commits · Logically-grouped PRs

---

## Phase 0 — Scaffold (PR-00)

**Goal:** Runnable project with working CI gate before any feature code.

### FB-00 `feat/fb-00-scaffold`

Commits (in order):
1. `chore(scaffold): init package.json, tsconfig, tsup config`
2. `chore(ci): add vitest + tsc typecheck scripts`
3. `chore(ci): add GitHub Actions workflow (typecheck + test)`
4. `docs(scaffold): add CLAUDE.md and IMPLEMENTATION_PLAN.md`

**Done when:** `npm test` passes (empty test suite), `tsc --noEmit` passes, CI green.

---

## Phase 1 — Core Tracing (PR-01)

**Goal:** A single root trace with child spans can be created, queried, and serialised.
Tracer Bullet: `createTrace() → startSpan() → endSpan() → toOTEL()` works end-to-end.

### FB-01 `feat/fb-01-core-tracing`

**Data models first (TDD):**

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(core): TraceContext shape and lifecycle` | `src/core/TraceContext.test.ts` | Failing tests for create/start/end |
| `feat(core): TraceContext + Span data models` | `src/core/TraceContext.ts`, `src/core/types.ts` | Minimal passing impl |
| `test(core): SpanLifecycle attach metadata and thought blocks` | `src/core/SpanLifecycle.test.ts` | Failing |
| `feat(core): SpanLifecycle with metadata + thought blocks` | `src/core/SpanLifecycle.ts` | Passing |
| `test(core): toOTEL serialiser round-trip` | `src/export/OTELSerializer.test.ts` | Failing |
| `feat(export): OTELSerializer — trace → OTEL spans` | `src/export/OTELSerializer.ts` | Passing |
| `chore(core): export public API from index.ts` | `src/index.ts` | Wire up exports |

**Done when:** Every span attribute (latency, token counts, thought blocks, parent-child hierarchy) survives a `toOTEL()` round-trip in tests.

---

## Phase 2 — Token & Cost Tracking (PR-02)

**Goal:** Every span records token usage; a configurable circuit breaker halts execution at budget limit.
Tracer Bullet: attach tokens to a span → accumulate cost → trigger HITL alert at threshold.

### FB-02 `feat/fb-02-token-cost`

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(cost): TokenCounter accumulates per-model usage` | `src/cost/TokenCounter.test.ts` | Failing |
| `feat(cost): TokenCounter` | `src/cost/TokenCounter.ts` | Passing |
| `test(cost): CostCalculator uses configurable pricing table` | `src/cost/CostCalculator.test.ts` | Failing |
| `feat(cost): CostCalculator with default Claude + GPT-4o pricing` | `src/cost/CostCalculator.ts`, `src/cost/defaultPricing.ts` | Passing |
| `test(cost): CircuitBreaker fires HITL event at threshold` | `src/cost/CircuitBreaker.test.ts` | Failing |
| `feat(cost): CircuitBreaker — event-based, non-blocking` | `src/cost/CircuitBreaker.ts` | Passing |
| `test(cost): ModelAttributionReport aggregates cost vs success per model` | `src/cost/ModelAttribution.test.ts` | Failing |
| `feat(cost): ModelAttribution` | `src/cost/ModelAttribution.ts` | Passing |
| `refactor(core): integrate TokenCounter into SpanLifecycle` | `src/core/SpanLifecycle.ts` | Wire cost into spans |

**Done when:** A span with 1000 tokens on a $0.50 budget fires a `circuit-breaker:limit-reached` event without throwing.

---

## Phase 3 — OTEL Export + SQLite Backend (PR-03)

**Goal:** Traces flow from memory into a local SQLite DB and can be queried back.
Tracer Bullet: `createTrace() → endSpan() → flush() → queryByTraceId()` works against real SQLite.

### FB-03 `feat/fb-03-otel-sqlite`

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(export): ExportAdapter interface contract` | `src/export/ExportAdapter.test.ts` | Failing |
| `feat(export): ExportAdapter interface + InMemoryAdapter` | `src/export/ExportAdapter.ts`, `src/export/InMemoryAdapter.ts` | Passing |
| `test(adapters): SQLiteAdapter stores and retrieves spans` | `src/adapters/sqlite/SQLiteAdapter.integration.test.ts` | Failing (needs real file) |
| `feat(adapters): SQLiteAdapter — write + query spans` | `src/adapters/sqlite/SQLiteAdapter.ts`, `src/adapters/sqlite/schema.ts` | Passing |
| `test(adapters): SQLiteAdapter handles concurrent writes` | same file | Edge-case tests |
| `feat(adapters): SQLiteAdapter WAL mode + transaction batching` | `src/adapters/sqlite/SQLiteAdapter.ts` | Performance |
| `chore(export): wire SQLiteAdapter as default dev backend` | `src/index.ts` | Config |

**Done when:** Integration test confirms a 10-span trace survives a process restart (persisted and re-read from `.db` file).

---

## Phase 4 — Evaluation Framework (PR-04)

**Goal:** Deterministic evals pass/fail automatically; LLM-judge evals are gated.
Tracer Bullet: `EvalRunner.run(toolCallAccuracyEval, trace)` returns a typed `EvalResult`.

### FB-04 `feat/fb-04-eval-framework`

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(evals): EvalRunner accepts eval definitions and returns results` | `src/evals/EvalRunner.test.ts` | Failing |
| `feat(evals): EvalRunner + EvalResult types` | `src/evals/EvalRunner.ts`, `src/evals/types.ts` | Passing |
| `test(evals): ToolCallAccuracyEval detects ghost params` | `src/evals/deterministic/ToolCallAccuracy.test.ts` | Failing |
| `feat(evals): ToolCallAccuracyEval` | `src/evals/deterministic/ToolCallAccuracy.ts` | Passing |
| `test(evals): ArchitecturalAdherenceEval validates ADR rules` | `src/evals/deterministic/ArchitecturalAdherence.test.ts` | Failing |
| `feat(evals): ArchitecturalAdherenceEval` | `src/evals/deterministic/ArchitecturalAdherence.ts` | Passing |

### FB-05 `feat/fb-05-golden-trace-regression`

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(evals): GoldenTraceEval compares trace against fixture` | `src/evals/regression/GoldenTraceEval.test.ts` | Failing |
| `feat(evals): GoldenTraceEval — structural diff of span sequence` | `src/evals/regression/GoldenTraceEval.ts` | Passing |
| `chore(evals): add example golden fixture` | `tests/fixtures/golden/example-trace.json` | Sample data |
| `test(evals): LLMJudgeEval interface + mock judge` | `src/evals/llm-judge/LLMJudgeEval.test.ts` | Failing (mock) |
| `feat(evals): LLMJudgeEval with configurable judge function` | `src/evals/llm-judge/LLMJudgeEval.ts` | Passing |

**Done when:** `vitest run` passes all deterministic evals; `EVAL=true vitest run` additionally runs LLM-judge evals with a mock judge.

---

## Phase 5 — Incident Response (PR-05)

**Goal:** Repeating trace patterns are detected, MOD-04 receives an interrupt signal, and a post-mortem is written to disk.
Tracer Bullet: inject a 3x repeating span sequence → detector fires → post-mortem `.md` appears in `/post-mortems/`.

### FB-06 `feat/fb-06-incident-response`

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(incident): LoopDetector identifies repeating span patterns` | `src/incident/LoopDetector.test.ts` | Failing |
| `feat(incident): LoopDetector — sliding window hash comparison` | `src/incident/LoopDetector.ts` | Passing |
| `test(incident): InterruptEmitter fires on detection` | `src/incident/InterruptEmitter.test.ts` | Failing |
| `feat(incident): InterruptEmitter — EventEmitter-based, async-safe` | `src/incident/InterruptEmitter.ts` | Passing |
| `test(incident): PostMortemGenerator writes markdown report` | `src/incident/PostMortemGenerator.test.ts` | Failing |
| `feat(incident): PostMortemGenerator — markdown with trace replay` | `src/incident/PostMortemGenerator.ts` | Passing |
| `refactor(incident): wire LoopDetector into SpanLifecycle.endSpan()` | `src/core/SpanLifecycle.ts` | Integration |

**Done when:** E2E test confirms repeating-span trace produces a post-mortem file with correct trace ID, detected pattern, and timestamp.

---

## Phase 6 — External Adapters (PR-06)

**Goal:** Export to Langfuse/Phoenix (HTTP) and expose Prometheus metrics.
Tracer Bullet: single trace POSTed to a mock Langfuse server receives correct OTEL payload.

### FB-07 `feat/fb-07-external-adapters`

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(adapters): LangfuseAdapter sends correct OTEL payload` | `src/adapters/langfuse/LangfuseAdapter.test.ts` | Failing (mock server) |
| `feat(adapters): LangfuseAdapter` | `src/adapters/langfuse/LangfuseAdapter.ts` | Passing |
| `test(adapters): PrometheusAdapter exposes token + cost metrics` | `src/adapters/prometheus/PrometheusAdapter.test.ts` | Failing |
| `feat(adapters): PrometheusAdapter — counter + gauge metrics` | `src/adapters/prometheus/PrometheusAdapter.ts` | Passing |
| `docs(adapters): adapter configuration guide` | `docs/adapters.md` | Usage examples |

**Done when:** `LangfuseAdapter` and `PrometheusAdapter` tests pass with mock transports.

---

## Phase 7 — Grafana Tempo Adapter (PR-07)

**Goal:** Export OTEL traces to Grafana Tempo (local or Grafana Cloud) over OTLP/HTTP.
Tracer Bullet: single trace POSTed to a mock Tempo OTLP endpoint receives correct OTEL payload + Basic auth header.

### FB-08 `feat/fb-08-tempo-adapter`

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(adapters): TempoAdapter OTLP/HTTP trace export — failing tests` | `src/adapters/tempo/TempoAdapter.test.ts` | Failing (mock fetch) |
| `feat(adapters): TempoAdapter — OTLP/HTTP export to Grafana Tempo` | `src/adapters/tempo/TempoAdapter.ts` | Passing |
| `chore(adapters): wire TempoAdapter into public API` | `src/index.ts` | Exports |
| `docs(adapters): add TempoAdapter to adapter guide` | `docs/adapters.md` | Usage examples |

**Done when:** `TempoAdapter` tests pass with mock fetch; both Grafana Cloud (Basic auth) and unauthenticated local Tempo patterns covered.

---

## Phase 8 — HITL Webhook Delivery (PR-08)

**Goal:** CircuitBreaker and LoopDetector signals can be delivered to external systems
(Slack, PagerDuty, custom handlers) over HTTP without coupling to any specific platform.
Tracer Bullet: CircuitBreaker `limit-reached` event wired to `WebhookNotifier.send()` delivers
correct JSON payload to a mock endpoint.

### FB-09 `feat/fb-09-hitl-webhook`

| Commit | File(s) | Description |
|--------|---------|-------------|
| `test(notify): WebhookNotifier HTTP delivery + event integration — failing tests` | `src/notify/WebhookNotifier.test.ts` | Failing (mock fetch) |
| `feat(notify): WebhookNotifier — JSON POST delivery for HITL signals` | `src/notify/WebhookNotifier.ts` | Passing |
| `chore(notify): wire WebhookNotifier into public API` | `src/index.ts` | Exports |

**Done when:** `WebhookNotifier` tests pass with mock fetch; CircuitBreaker and LoopDetector
integration patterns verified end-to-end without arbitrary timeouts.

---

## PR Summary

| PR    | Feature Branches | Scope                                    |
|-------|-----------------|------------------------------------------|
| PR-00 | FB-00           | Project scaffold + CI                    |
| PR-01 | FB-01           | Core tracing data model + OTEL serialiser|
| PR-02 | FB-02           | Token counting + cost calc + circuit breaker |
| PR-03 | FB-03           | OTEL export interface + SQLite adapter   |
| PR-04 | FB-04 + FB-05   | Eval framework (deterministic + LLM-judge + golden trace) |
| PR-05 | FB-06           | Incident response (loop detect + interrupt + post-mortem) |
| PR-06 | FB-07           | External adapters (Langfuse, Prometheus) |
| PR-07 | FB-08           | Grafana Tempo adapter (OTLP/HTTP)        |
| PR-08 | FB-09           | HITL webhook delivery                    |

---

## Definition of Done (per PR)

- [ ] All `*.test.ts` pass: `vitest run`
- [ ] No TypeScript errors: `tsc --noEmit`
- [ ] No regressions on previously-merged tests
- [ ] Tracer bullet path documented in PR description
- [ ] Public API surface added to `src/index.ts`

---

## Deferred (Post-v1)

- Web UI for trace visualisation
