import XMLImporter from './XMLImporter'
import XMLExporter from './XMLExporter'
import { ATTRIBUTE_PROPERTY_TYPES } from './_SchemaConstants'
import _requiresPropertyElements from './_requiresPropertyElements'

export default function createXmlConverterFactory (rootType, definition) {
  const converters = []
  for (const nodeSpec of definition.nodes.values()) {
    switch (nodeSpec.parentType) {
      case '@node': {
        converters.push(_createNodeConverter(nodeSpec))
        break
      }
      case '@text': {
        converters.push(_createTextNodeConverter(nodeSpec))
        break
      }
      case '@annotation': {
        converters.push(_createAnnotationConverter(nodeSpec))
        break
      }
      default:
        throw new Error(`Unsupported parent type ${nodeSpec.parentType}`)
    }
  }
  return {
    createImporter (doc) {
      return new NextDocumentXmlImporter({ converters }, doc, { rootType, definition })
    },
    createExporter () {
      return new NextDocumentXmlExporter({ converters }, { rootType, definition })
    }
  }
}

class NextDocumentXmlImporter extends XMLImporter {
  constructor (params, doc, options = {}) {
    super(params, doc, options)

    this.rootType = options.rootType
    this.definition = options.definition
  }

  importIntoDocument (xmlDom) {
    const doc = this.state.doc
    doc.clear()
    const rootEl = xmlDom.find(this.rootType)
    const root = this.convertElement(rootEl)
    doc.root = root
  }
}

class NextDocumentXmlExporter extends XMLExporter {
  constructor (params, options = {}) {
    super(params, options)

    this.rootType = options.rootType
    this.definition = options.definition
  }
}

function _createAnnotationConverter (nodeSpec) {
  class AnnotationConverter {
    get type () { return nodeSpec.type }

    get tagName () { return nodeSpec.type }

    import (el, node, importer) {
      _importAttributes(nodeSpec, el, node)
    }

    export (node, el, exporter) {
      _exportAttributes(nodeSpec, node, el)
    }
  }
  return AnnotationConverter
}

function _createTextNodeConverter (nodeSpec) {
  class TextNodeConverter {
    get type () { return nodeSpec.type }

    get tagName () { return nodeSpec.type }

    import (el, node, importer) {
      _importAttributes(nodeSpec, el, node)
      node.content = importer.annotatedText(el, [node.id, 'content'])
    }

    export (node, el, exporter) {
      _exportAttributes(nodeSpec, node, el)
      el.append(exporter.annotatedText([node.id, 'content']))
    }
  }
  return TextNodeConverter
}

function _createNodeConverter (nodeSpec) {
  // TODO: for now we use property elements for all 'structured' nodes
  const usePropertyEl = _requiresPropertyElements(nodeSpec)
  class NodeConverter {
    get type () { return nodeSpec.type }

    get tagName () { return nodeSpec.type }

    import (el, node, importer) {
      _importAttributes(nodeSpec, el, node)
      if (usePropertyEl) {
        for (const propEl of el.children) {
          const propName = propEl.tagName
          _importChildProperty(nodeSpec, propName, propEl, node, importer)
        }
      } else {
        _importChildProperty(nodeSpec, nodeSpec.childPropertyNames[0], el, node, importer)
      }
    }

    export (node, el, exporter) {
      _exportAttributes(nodeSpec, node, el)
      if (usePropertyEl) {
        for (const propName of nodeSpec.childPropertyNames) {
          const propEl = el.createElement(propName)
          const childEl = _exportChildProperty(nodeSpec, propName, node, propEl, exporter)
          el.append(childEl)
        }
      } else {
        _exportChildProperty(nodeSpec, nodeSpec.childPropertyNames[0], node, el, exporter)
      }
    }
  }
  return NodeConverter
}

function _importChildProperty (nodeSpec, propName, el, node, importer) {
  const propSpec = nodeSpec.properties.get(propName)
  let val
  switch (propSpec.type) {
    case 'child': {
      const childNode = importer.convertElement(el)
      val = childNode.id
      break
    }
    case 'children':
    case 'container': {
      const childNodes = el.getChildren().map(childEl => {
        return importer.convertElement(childEl)
      })
      val = childNodes.map(n => n.id)
      break
    }
    case 'text': {
      val = importer.annotatedText(el, [node.id, propName])
      break
    }
    default:
      throw new Error('Illegal state')
  }
  node[propName] = val
}

function _exportChildProperty (nodeSpec, propName, node, el, exporter) {
  const propSpec = nodeSpec.properties.get(propName)
  switch (propSpec.type) {
    case 'child': {
      const childNode = node.resolve(propName)
      if (childNode) {
        const childXml = exporter.convertNode(childNode)
        // HACK: we need to find a clear approach to this
        // we have seen this edge case, where the property was called the same as the child node
        // having only that specific allowed child type
        // In this case it is desired to omit the property element
        if (childNode.type === propName) {
          const propSpec = nodeSpec.properties.get(propName)
          if (propSpec.options && propSpec.options.childTypes.length === 1) {
            return childXml
          }
        }
        el.append(childXml)
      }
      break
    }
    case 'children':
    case 'container': {
      const childNodes = node.resolve(propName)
      el.append(childNodes.map(childNode => exporter.convertNode(childNode)))
      break
    }
    case 'text': {
      el.append(exporter.annotatedText([node.id, propName]))
      break
    }
    default:
      throw new Error('Illegal state')
  }
  return el
}

function _importAttributes (nodeSpec, el, node) {
  for (const [propName, propSpec] of nodeSpec.properties) {
    const type = propSpec.type
    const str = el.getAttribute(propName)
    if (!ATTRIBUTE_PROPERTY_TYPES.has(type) || !str) continue
    let val
    switch (propSpec.type) {
      case 'integer': {
        val = parseInt(str)
        break
      }
      case 'number': {
        val = Number(str)
        break
      }
      case 'boolean': {
        val = (str === 'true')
        break
      }
      case 'string':
      case 'one': {
        val = str
        break
      }
      case 'string-array':
        val = str.split(';').map(s => s.trim())
        break
      case 'many': {
        val = str.split(/\s+/).map(s => s.trim())
        break
      }
      default:
        throw new Error('Illegal state')
    }
    node[propName] = val
  }
}

function _exportAttributes (nodeSpec, node, el) {
  for (const [propName, propSpec] of nodeSpec.properties) {
    const type = propSpec.type
    if (!ATTRIBUTE_PROPERTY_TYPES.has(type)) continue
    const val = node.get(propName)
    let str
    switch (propSpec.type) {
      case 'integer':
      case 'number':
      case 'boolean':
      case 'string':
      case 'one': {
        str = String(val)
        break
      }
      case 'string-array':
        str = val.join(';')
        break
      case 'many': {
        str = val.join(' ')
        break
      }
      default:
        throw new Error('Illegal state')
    }
    el.setAttribute(propName, str)
  }
}
