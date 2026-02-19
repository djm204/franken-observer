// @frankenbeast/observer — public API

export { TraceContext } from './core/TraceContext.js'
export { SpanLifecycle } from './core/SpanLifecycle.js'
export { OTELSerializer } from './export/OTELSerializer.js'

export type { Trace, Span, SpanStatus, TraceStatus, StartSpanOptions, EndSpanOptions } from './core/types.js'
export type { TokenUsage } from './core/SpanLifecycle.js'
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
