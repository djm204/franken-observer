// @frankenbeast/observer — public API

export { TraceContext } from './core/TraceContext.js'
export { SpanLifecycle } from './core/SpanLifecycle.js'
export { OTELSerializer } from './export/OTELSerializer.js'
export { TokenCounter } from './cost/TokenCounter.js'
export { CostCalculator } from './cost/CostCalculator.js'
export { CircuitBreaker } from './cost/CircuitBreaker.js'
export { ModelAttribution } from './cost/ModelAttribution.js'
export { DEFAULT_PRICING } from './cost/defaultPricing.js'

export type { Trace, Span, SpanStatus, TraceStatus, StartSpanOptions, EndSpanOptions } from './core/types.js'
export type { TokenUsage } from './core/SpanLifecycle.js'
export type { TokenRecord, TokenTotals } from './cost/TokenCounter.js'
export type { CircuitBreakerOptions, CircuitBreakerResult } from './cost/CircuitBreaker.js'
export type { AttributionEntry, AttributionRow } from './cost/ModelAttribution.js'
export type { ModelPricing, PricingTable } from './cost/defaultPricing.js'
export type {
  OTELPayload,
  OTELResourceSpans,
  OTELScopeSpans,
  OTELSpan,
  OTELAttribute,
  OTELAttributeValue,
  OTELStatus,
} from './export/OTELSerializer.js'

export const VERSION = '0.1.0'
