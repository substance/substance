import { isString, domHelpers, renderListNode } from 'substance'

export const EmphasisConverter = {
  type: 'emphasis',
  tagName: 'em',
  matchElement (el) {
    return (el.is('em') || el.is('i')) ||
      (el.is('span') && el.getStyle('font-style') === 'italic')
  }
}

export const HeadingConverter = {
  type: 'heading',
  matchElement (el) {
    return /^h\d$/.exec(el.tagName)
  },
  import (el, node, converter) {
    let match = /^h(\d?)$/.exec(el.tagName)
    node.level = parseInt(match[1])
    node.content = converter.annotatedText(el, [node.id, 'content'], { preserveWhitespace: true })
  },
  export (node, el, converter) {
    el.tagName = `h${node.level}`
    el.append(converter.annotatedText([node.id, 'content']))
  }
}

export const LinkConverter = {
  type: 'link',
  tagName: 'a',
  import (el, node) {
    let href = el.getAttribute('href')
    if (href) {
      node.href = href
    }
  },
  export (node, el) {
    el.setAttribute('href', node.href)
  }
}

export class ListConverter {
  get type () { return 'list' }

  matchElement (el) {
    return el.is('ul') || el.is('ol')
  }

  import (el, node, converter) {
    this._santizeNestedLists(el)

    let items = []
    let config = []
    domHelpers.walk(el, (el, level) => {
      if (!el.isElementNode()) return
      if (el.is('li')) {
        items.push({ el, level })
      } else if (!config[level]) {
        if (el.is('ul')) config[level] = 'bullet'
        else if (el.is('ol')) config[level] = 'order'
      }
    })
    this._createListItems(converter, node, items, config)
  }

  _createListItems (converter, node, items, levelTypes) {
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

export const ListItemConverter = {
  type: 'list-item',
  matchElement: function (el) {
    return el.is('li')
  },
  import: function (el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'])
  },
  export: function (node, el, converter) {
    el.append(converter.annotatedText(node.getPath()))
  }
}

export const ParagraphConverter = {
  type: 'paragraph',
  tagName: 'p',
  import (el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'])
  },
  export (node, el, converter) {
    el.append(converter.annotatedText([node.id, 'content']))
  }
}

export const PreformatConverter = {
  type: 'preformat',
  tagName: 'pre',
  import (el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'], { preserveWhitespace: true })
  },
  export (node, el, converter) {
    el.append(
      converter.annotatedText([node.id, 'content'])
    )
  }
}

export const StrongConverter = {
  type: 'strong',
  tagName: 'strong',
  matchElement (el) {
    return (el.is('strong') || el.is('b')) ||
      (el.is('span') && el.getStyle('font-weight') === '700')
  }
}

export const SubscriptConverter = {
  type: 'subscript',
  tagName: 'sub',
  matchElement (el) {
    return (el.is('sub')) || (el.is('span') && el.getStyle('vertical-align') === 'sub')
  }
}

export const SuperscriptConverter = {
  type: 'superscript',
  tagName: 'sup',
  matchElement (el) {
    return (el.is('sup')) || (el.is('span') && el.getStyle('vertical-align') === 'super')
  }
}
