class TextNodeConverter {
  constructor (type, tagName) {
    this.type = type
    this.tagName = tagName
  }

  import (el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'], { preserveWhitespace: true })
  }

  export (node, el, converter) {
    el.append(converter.annotatedText([node.id, 'content']))
  }
}

function _isTextNodeEmpty (el) {
  return Boolean(/^\s*$/.exec(el.textContent))
}

function _isMixed (el) {
  const childNodes = el.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
    if (child.isTextNode() && !_isTextNodeEmpty(child)) {
      return true
    }
  }
}

export const ParagraphConverter = new TextNodeConverter('paragraph', 'p')

export class HeadingConverter extends TextNodeConverter {
  constructor () {
    super('heading')
  }

  matchElement (el) {
    return /^h\d+$/.exec(el.tagName)
  }

  import (el, node, converter) {
    super.import(el, node, converter)

    const m = /^h(\d+)$/.exec(el.tagName)
    node.level = parseInt(m[1])
  }

  export (node, el, converter) {
    el.tagName = 'h' + node.level
    super.export(node, el, converter)
  }
}

export const FigureConverter = {
  type: 'figure',
  tagName: 'figure',
  import (el, node, converter) {
    const imgEl = el.find('img')
    if (imgEl) {
      node.image = imgEl.attr('src')
    }
    const figCaptionEl = el.find('figcaption')
    if (figCaptionEl) {
      // if the caption contains mixed content we assume that this implicitly on paragraph
      if (_isMixed(figCaptionEl)) {
        figCaptionEl.tagName = 'p'
        const paragraph = converter.convertElement(figCaptionEl)
        node.legend = [paragraph.id]
      } else {
        node.legend = figCaptionEl.getChildren().map(child => {
          if (!child.tagName === 'p') return
          const paragraph = converter.convertElement(child)
          return paragraph.id
        }).filter(Boolean)
      }
    }
  },
  export (node, el, converter) {
    const $$ = converter.$$
    el.append($$('img').attr('src', node.image))
    if (node.legend && node.legend.length > 0) {
      el.append($$('figcaption').append(
        node.resolve('legend').map(p => {
          return converter.convertNode(p)
        })
      ))
    }
  }
}

export const BoldConverter = {
  type: 'bold',
  tagName: 'b',
  matchElement (el) {
    return (el.is('b')) ||
      (el.is('span') && el.getStyle('font-weight') === '700')
  }
}

export const ItalicConverter = {
  type: 'italic',
  tagName: 'i',
  matchElement (el) {
    return (el.is('i')) ||
      (el.is('span') && el.getStyle('font-style') === 'italic')
  }
}

export const StrikeConverter = {
  type: 'strike',
  tagName: 'span',
  matchElement (el) {
    return el.getStyle('text-decoration') === 'line-through'
  },
  export (node, el) {
    el.setStyle('text-decoration', 'line-through')
  }
}

export const SubscriptConverter = {
  type: 'subscript',
  tagName: 'sub',
  matchElement (el) {
    return (el.is('sub')) ||
      (el.is('span') && el.getStyle('vertical-align') === 'sub')
  }
}

export const SuperscriptConverter = {
  type: 'superscript',
  tagName: 'sup',
  matchElement (el) {
    return (el.is('sup')) ||
      (el.is('span') && el.getStyle('vertical-align') === 'super')
  }
}

export const LinkConverter = {
  type: 'link',
  tagName: 'a',
  import (el, node) {
    node.href = el.getAttribute('href')
  },
  export (node, el) {
    el.setAttribute('href', node.href)
  }
}
