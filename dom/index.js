import * as domHelpers from './domHelpers'
import RenderingEngine from '../dom/RenderingEngine'

export { default as BrowserDOMElement } from './BrowserDOMElement'
export { default as compareDOMElementPosition } from './compareDOMElementPosition'
export { default as Component } from './Component'
export * from './componentHelpers'
export { default as DefaultDOMElement } from './DefaultDOMElement'
export { default as DOMElement } from './DOMElement'
export { default as DOMEventListener } from './DOMEventListener'
export { domHelpers }
export { default as DomUtils } from './domutils'
export { default as MemoryDOMElement } from './MemoryDOMElement'
export { default as nameWithoutNS } from './nameWithoutNS'
export { default as prettyPrintXML } from './prettyPrintXML'
export { default as RenderingEngine } from './RenderingEngine'
export { default as sanitizeHTML } from './sanitizeHTML'
export { default as VirtualElement } from './VirtualElement'

// expose the static factory for virtual elements
// used in render methods
export const $$ = RenderingEngine.createVirtualElement
