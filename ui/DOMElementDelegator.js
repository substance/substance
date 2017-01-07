import DOMElement from './DOMElement'

class DOMElementDelegator extends DOMElement {
  constructor() {
    super()
    this.el = null
  }
}

var _delegators = {
  'getNativeElement': null,
  'hasClass': false,
  'getAttribute': null,
  'getAttributes': {},
  'getProperty': null,
  'getTagName': 'throw',
  'getId': 'throw',
  'getValue': null,
  'getStyle': null,
  'getTextContent': '',
  'getInnerHTML': '',
  'getOuterHTML': '',
  'getChildCount': 0,
  'getChildNodes': [],
  'getChildren': [],
  'getChildAt': null,
  'getParent': null,
  'getRoot': null,
  'getEventListeners': [],
  'find': null,
  'findAll': [],
  'is': false,
  'isTextNode': false,
  'isElementNode': false,
  'isCommentNode': false,
  'isDocumentNode': false,
  'isInDocument': false,
  'position': null
}

forEach(_delegators, function(defaultValue, method) {
  DOMElementDelegator.prototype[method] = function() {
    if (!this.el) {
      if (defaultValue === 'throw') {
        throw new Error('This component has not been rendered yet.')
      } else {
        return defaultValue
      }
    }
    return this.el[method].apply(this.el, arguments)
  }
})

// Delegators implementing the DOMElement interface
// these are chainable
;[
  'addClass', 'removeClass',
  'setAttribute', 'removeAttribute',
  'setProperty', 'removeProperty',
  'setTagName', 'setId', 'setValue', 'setStyle',
  'setTextContent', 'setInnerHTML',
  'addEventListener', 'removeEventListener',
  'appendChild', 'insertAt', 'insertBefore',
  'remove', 'removeAt', 'removeChild', 'replaceChild', 'empty',
  'focus', 'blur', 'click'
].forEach(function(method) {
  DOMElementDelegator.prototype[method] = function() {
    if (!this.el) {
      throw new Error('This component has not been rendered yet.')
    }
    this.el[method].apply(this.el, arguments)
    return this
  }
})

export default DOMElementDelegator
