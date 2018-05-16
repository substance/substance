import isString from '../../util/isString'
import renderListNode from '../../util/renderListNode'
import { walk } from '../../dom/domHelpers'

export default class ListHTMLConverter {
  get type () { return 'list' }

  matchElement (el) {
    return el.is('ul') || el.is('ol')
  }

  import (el, node, converter) {
    this._santizeNestedLists(el)

    let items = []
    let config = []
    walk(el, (el, level) => {
      if (!el.isElementNode()) return
      if (el.is('li')) {
        items.push({ el, level })
      } else if (!config[level]) {
        if (el.is('ul')) config[level] = 'bullet'
        else if (el.is('ol')) config[level] = 'order'
      }
    })
    this._createItems(converter, node, items, config)
  }

  // this is specific to the node model defined in ListNode
  _createItems (converter, node, items, levelTypes) {
    node.items = items.map(d => {
      let listItem = converter.convertElement(d.el)
      listItem.level = d.level
      return listItem.id
    })
    node.listType = levelTypes.join(',')
  }

  export (node, el, converter) {
    let $$ = converter.$$
    let _createElement = function (arg) {
      if (isString(arg)) {
        return $$(arg)
      } else {
        let item = arg
        let path = item.getPath()
        return $$('li').append(converter.annotatedText(path))
      }
    }
    let _el = renderListNode(node, _createElement)
    el.tagName = _el.tagName
    el.attr(_el.getAttributes())
    el.append(_el.getChildNodes())
    return el
  }

  _santizeNestedLists (root) {
    // pulling out uls from <li> to simplify the problem
    /*
      E.g.
      `<ul><li>Foo:<ul>...</ul></li>`
      Is turned into:
      `<ul><li>Foo:</li><ul>...</ul></ul>`
    */
    let nestedLists = root.findAll('ol,ul')
    nestedLists.forEach((el) => {
      while (!el.parentNode.is('ol,ul')) {
        let parent = el.parentNode
        let grandParent = parent.parentNode
        let pos = grandParent.getChildIndex(parent)
        grandParent.insertAt(pos + 1, el)
      }
    })
  }
}
