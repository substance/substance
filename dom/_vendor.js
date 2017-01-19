import ElementType from 'domelementtype'
import cssSelect from 'css-select'
import DomUtils from 'domutils'
import attributes from 'css-select/lib/attributes'
import Parser from 'htmlparser2/lib/Parser'
import domSerializer from './_domSerializer'

// monkey patching css-select/lib/attributes to reflect difference in how classes are stored
// Note: in XNode classes are stored in a Set instead of a string
const _elementRule = attributes.rules.element
attributes.rules.element = function(next, data) {
  if (data.name === 'class') {
    let value = data.value
    if (/\s/.test(value)) return function() { return false }
    return function clazz(elem) {
      let classes = elem.classes
      return classes && classes.has(value) && next(elem)
    }
  } else {
    return _elementRule(next, data)
  }
}

Parser.prototype.oncdata = function(value){
  this._updatePosition(1);

  if(this._options.xmlMode){
    if(this._cbs.oncdatastart) this._cbs.oncdatastart(value)
    if(this._cbs.oncdataend) this._cbs.oncdataend()
  } else {
    this.oncomment("[CDATA[" + value + "]]")
  }
}

export { cssSelect, domSerializer, DomUtils, ElementType, Parser, renderXNode }