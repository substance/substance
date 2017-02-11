/*
  Implementation essentially stolen from domhandler and adapted to work with XNode.

  Attention: as this is used as a global replacement of the 'dom-serializer' package
  this file can not be used directly.
*/

import ElementType from 'domelementtype'
import entities from 'entities'

const booleanAttributes = {
  __proto__: null,
  allowfullscreen: true,
  async: true,
  autofocus: true,
  autoplay: true,
  checked: true,
  controls: true,
  default: true,
  defer: true,
  disabled: true,
  hidden: true,
  ismap: true,
  loop: true,
  multiple: true,
  muted: true,
  open: true,
  readonly: true,
  required: true,
  reversed: true,
  scoped: true,
  seamless: true,
  selected: true,
  typemustmatch: true
}

const unencodedElements = {
  __proto__: null,
  style: true,
  script: true,
  xmp: true,
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  noscript: true
}

const singleTag = {
  __proto__: null,
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
}

function formatAttribs(el, opts) {
  let output = []
  const attributes = el.attributes
  // Loop through the attributes
  attributes.forEach((value, key) => {
    // as 'class' and 'style' are computed dynamically we need to check if there are any values set
    // otherwise this will generate empty attributes
    if (key === 'class' && el.classes.size === 0) return
    if (key === 'style' && el.styles.size === 0) return
    if (!value && booleanAttributes[key]) {
      output.push(key)
    } else {
      output.push(key + '="' + (opts.decodeEntities ? entities.encodeXML(value) : value) + '"')
    }
  })
  if (el.classes.size > 0) {
    output.push('class="'+el.getAttribute('class')+'"')
  }
  if (el.styles.size >0) {
    output.push('style="'+el.getAttribute('style')+'"')
  }
  return output.join(' ')
}

function render(dom, opts) {
  if (!Array.isArray(dom)) dom = [dom]
  opts = opts || {}

  let output = []

  for(var i = 0; i < dom.length; i++){
    let elem = dom[i]

    if (elem.type === 'root') {
      output.push(render(elem.childNodes, opts))
    } else if (ElementType.isTag(elem)) {
      output.push(renderTag(elem, opts))
    } else if (elem.type === ElementType.Directive) {
      output.push(renderDirective(elem))
    } else if (elem.type === ElementType.Comment) {
      output.push(renderComment(elem))
    } else if (elem.type === ElementType.CDATA) {
      output.push(renderCdata(elem))
    } else {
      output.push(renderText(elem, opts))
    }
  }

  return output.join('')
}

function renderTag(elem, opts) {
  // Handle SVG
  if (elem.name === "svg") opts = {decodeEntities: opts.decodeEntities, xmlMode: true}

  let tag = '<' + elem.name
  let attribs = formatAttribs(elem, opts)

  if (attribs) {
    tag += ' ' + attribs
  }

  if (
    opts.xmlMode
    && (!elem.childNodes || elem.childNodes.length === 0)
  ) {
    tag += '/>'
  } else {
    tag += '>'
    if (elem.childNodes) {
      tag += render(elem.childNodes, opts)
    }

    if (!singleTag[elem.name] || opts.xmlMode) {
      tag += '</' + elem.name + '>'
    }
  }

  return tag
}

function renderDirective(elem) {
  return '<' + elem.data + '>'
}

function renderText(elem, opts) {
  var data = elem.data || ''
  // if entities weren't decoded, no need to encode them back
  if (opts.decodeEntities && !(elem.parent && elem.parent.name in unencodedElements)) {
    data = entities.encodeXML(data)
  }
  return data
}

function renderCdata(elem) {
  return '<![CDATA[' + elem.childNodes[0].data + ']]>'
}

function renderComment(elem) {
  return '<!--' + elem.data + '-->'
}

export default render
