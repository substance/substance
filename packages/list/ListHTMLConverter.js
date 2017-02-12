import isString from '../../util/isString'
import renderListNode from './renderListNode'
import getListTagName from './getListTagName'

/*
  HTML converter for Lists.
 */
export default {

  type: "list",

  matchElement: function(el) {
    return el.is('ul') || el.is('ol')
  },

  import: function(el, node, converter) {
    let self = this
    this._santizeNestedLists(el)
    if (el.is('ol')) {
      node.ordered = true
    }
    let itemEls = el.findAll('li')
    itemEls.forEach(function(li) {
      // ATTENTION: pulling out nested list elements here on-the-fly
      let listItem = converter.convertElement(li)
      listItem.level = _getLevel(li)
      node.items.push(listItem.id)
    })
    function _getLevel(li) {
      let _el = li
      let level = 1
      while(_el) {
        if (_el.parentNode === el) return level
        _el = _el.parentNode
        if (self.matchElement(_el)) level++
      }
    }
  },

  export: function(node, el, converter) {
    let $$ = converter.$$
    el.tagName = getListTagName(node)
    renderListNode(node, el, (arg)=>{
      if (isString(arg)) {
        return $$(arg)
      } else {
        let item = arg
        return $$('li').append(converter.annotatedText(item.getTextPath()))
      }
    })
    return el
  },

  _santizeNestedLists(root) {
    let nestedLists = root.findAll('ol,ul')
    nestedLists.forEach((el)=>{
      while (!el.parentNode.is('ol,ul')) {
        // pull it up
        let parent = el.parentNode
        let grandParent = parent.parentNode
        let pos = grandParent.getChildIndex(parent)
        grandParent.insertAt(pos+1, el)
      }
    })
  }
}
