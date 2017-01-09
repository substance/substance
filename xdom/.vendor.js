import ElementType from 'domelementtype'
import cssSelect from 'css-select'
import DomUtils from 'domutils'
import attributes from 'css-select/lib/attributes'
import Parser from 'htmlparser2/lib/Parser'
import domSerializer from './.domSerializer'

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


export { cssSelect, domSerializer, DomUtils, ElementType, Parser, renderXNode }