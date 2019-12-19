import XMLImporter from './XMLImporter'
import XMLExporter from './XMLExporter'
import { ATTRIBUTE_PROPERTY_TYPES } from './_SchemaConstants'
import _requiresPropertyElements from './_requiresPropertyElements'
import { isNil } from '../util'

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
      case '@asset': {
        converters.push(_createAssetConverter(nodeSpec))
        break
      }
      default:
        throw new Error(`Unsupported parent type ${nodeSpec.parentType}`)
    }
  }
  return {
    createImporter (doc, context) {
      return new NextDocumentXmlImporter({ converters }, doc, { rootType, definition, context })
    },
    createExporter (context) {
      return new NextDocumentXmlExporter({ converters }, { rootType, definition, context })
    }
  }
}

class NextDocumentXmlImporter extends XMLImporter {
  constructor (params, doc, options = {}) {
    super(params, doc, options)

    this.rootType = options.rootType
    this.definition = options.definition
    this.context = options.context || {}
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
    this.context = options.context || {}
  }
}

function _createBasicNodeConverter (nodeSpec) {
  class BasicNodeConverter {
    get type () { return nodeSpec.type }

    get tagName () { return nodeSpec.type }

    get nodeSpec () { return nodeSpec }

    import (el, node, importer) {}

    export (node, el, exporter) {}

    _importAttributes (el, node, importer) {
      for (const [propName, propSpec] of nodeSpec.properties) {
        this._importAttribute(propName, propSpec, el, node, importer)
      }
    }

    _importAttribute (propName, propSpec, el, node, importer) {
      const type = propSpec.type
      const str = el.getAttribute(propName)
      if (!ATTRIBUTE_PROPERTY_TYPES.has(type) || !str) return
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

    _exportAttributes (node, el, exporter) {
      for (const [propName, propSpec] of nodeSpec.properties) {
        this._exportAttribute(propName, propSpec, node, el, exporter)
      }
    }

    _exportAttribute (propName, propSpec, node, el, exporter) {
      const type = propSpec.type
      if (!ATTRIBUTE_PROPERTY_TYPES.has(type)) return
      const isOptional = propSpec.options.optional
      const val = node.get(propName)
      let str
      if (isNil(val)) {
        // skip if attribute is optional
        if (isOptional) {
          return
        } else {
          str = ''
        }
      } else {
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
            if (val.length === 0 && isOptional) return
            str = val.join(';')
            break
          case 'many': {
            if (val.length === 0 && isOptional) return
            str = val.join(' ')
            break
          }
          default:
            throw new Error('Illegal state')
        }
      }
      el.setAttribute(propName, str)
    }
  }
  return BasicNodeConverter
}

function _createAnnotationConverter (nodeSpec) {
  class AnnotationConverter extends _createBasicNodeConverter(nodeSpec) {
    import (el, node, importer) {
      this._importAttributes(el, node, importer)
    }

    export (node, el, exporter) {
      this._exportAttributes(node, el, exporter)
    }
  }
  return AnnotationConverter
}

function _createTextNodeConverter (nodeSpec) {
  class TextNodeConverter extends _createBasicNodeConverter(nodeSpec) {
    import (el, node, importer) {
      this._importAttributes(el, node, importer)
      node.content = importer.annotatedText(el, [node.id, 'content'])
    }

    export (node, el, exporter) {
      this._exportAttributes(node, el, exporter)
      el.append(exporter.annotatedText([node.id, 'content']))
    }
  }
  return TextNodeConverter
}

function _createNodeConverter (nodeSpec) {
  class NodeConverter extends _createBasicNodeConverter(nodeSpec) {
    import (el, node, importer) {
      this._importAttributes(el, node, importer)
      this._importChildProperties(el, node, importer)
    }

    export (node, el, exporter) {
      this._exportAttributes(node, el, exporter)
      this._exportChildProperties(node, el, exporter)
    }

    _importChildProperties (el, node, importer) {
      // TODO: for now we use property elements for all 'structured' nodes
      const usePropertyEl = _requiresPropertyElements(nodeSpec)
      if (usePropertyEl) {
        for (const propEl of el.children) {
          const propName = propEl.tagName
          this._importChildProperty(propName, propEl, node, importer)
        }
      } else if (nodeSpec.childPropertyNames.length === 1) {
        this._importChildProperty(nodeSpec.childPropertyNames[0], el, node, importer)
      } else if (nodeSpec.childPropertyNames.length > 1) {
        throw new Error("Only one child property allowed when 'omitPropertyElement=true'")
      }
    }

    _importChildProperty (propName, propEl, node, importer) {
      const propSpec = nodeSpec.properties.get(propName)
      let val
      switch (propSpec.type) {
        case 'child': {
          const childNode = importer.convertElement(propEl)
          val = childNode.id
          break
        }
        case 'children':
        case 'container': {
          const childNodes = propEl.getChildren().map(childEl => {
            return importer.convertElement(childEl)
          })
          val = childNodes.map(n => n.id)
          break
        }
        case 'text': {
          val = importer.annotatedText(propEl, [node.id, propName])
          break
        }
        default:
          throw new Error('Illegal state')
      }
      node[propName] = val
    }

    _exportChildProperties (node, el, exporter) {
      // TODO: try to simplify this. I don't like how the decision whether to append
      // to 'el' or use a property element is taken in _exportChildProperty()

      // TODO: for now we use property elements for all 'structured' nodes
      const usePropertyEl = _requiresPropertyElements(nodeSpec)
      if (usePropertyEl) {
        for (const propName of nodeSpec.childPropertyNames) {
          const propEl = el.createElement(propName)
          // ATTENTION: in some cases the propEl is omitted
          // thus we allow to provide a different element to be appended
          const childEl = this._exportChildProperty(propName, node, propEl, exporter)
          el.append(childEl)
        }
      } else if (nodeSpec.childPropertyNames.length === 1) {
        const propEl = el
        const childEl = this._exportChildProperty(nodeSpec.childPropertyNames[0], node, propEl, exporter)
        // NOTE: when property elements are omitted generally
        // then we use el as property element
        // only if a different element is returned we have to append (which sounds like an edge case)
        if (childEl !== propEl) {
          el.append(childEl)
        }
      } else if (nodeSpec.childPropertyNames.length > 1) {
        throw new Error("Only one child property allowed when 'omitPropertyElement=true'")
      }
    }

    _exportChildProperty (propName, node, propEl, exporter) {
      const propSpec = nodeSpec.properties.get(propName)
      switch (propSpec.type) {
        case 'child': {
          const childNode = node.resolve(propName)
          if (childNode) {
            const childEl = exporter.convertNode(childNode)
            // TODO: we need to find a clearer approach to this
            // In some cases, e.g. when the property is called the same as the (only) child node type,
            // it is desired to omit the property element
            if (childNode.type === propName && propSpec.options && propSpec.options.childTypes.length === 1) {
              propEl = childEl
            } else {
              propEl.append(childEl)
            }
          }
          break
        }
        case 'children':
        case 'container': {
          const childNodes = node.resolve(propName)
          propEl.append(childNodes.map(childNode => exporter.convertNode(childNode)))
          break
        }
        case 'text': {
          propEl.append(exporter.annotatedText([node.id, propName]))
          break
        }
        default:
          throw new Error('Illegal state')
      }
      return propEl
    }
  }
  return NodeConverter
}

function _createAssetConverter (nodeSpec) {
  class AssetConverter extends _createNodeConverter(nodeSpec) {
    _getArchive (imOrExporter) {
      const archive = imOrExporter.context.archive
      if (!archive) {
        throw new Error("'options.context' is required")
      }
      return archive
    }

    _importAttribute (propName, propSpec, el, node, importer) {
      // TODO: this is pretty hard coded, maybe we could introduce a property type instead
      // and make this a general behavior
      switch (propName) {
        case 'src': {
          // NOTE: stored as filename in XML, we need to map to assetId internally
          const filename = el.getAttribute('src')
          const archive = this._getArchive(importer)
          const asset = archive.getAssetForFilename(filename)
          if (asset) {
            node.src = asset.id
          }
          break
        }
        case 'mimetype': {
          // NOTE: no matter what is stored in XML, we won't gonna use it
          const filename = el.getAttribute('src')
          const archive = this._getArchive(importer)
          const asset = archive.getAssetForFilename(filename)
          if (asset) {
            node.mimetype = asset.mimetype
          }
          break
        }
        default: {
          return super._importAttribute(propName, propSpec, el, node, importer)
        }
      }
    }

    _exportAttribute (propName, propSpec, node, el, exporter) {
      // TODO: this is pretty hard coded, maybe we could introduce a property type instead
      // and make this a general behavior
      switch (propName) {
        case 'src': {
          // NOTE: internally stores an assetId, and needs to be mapped to filename
          const archive = this._getArchive(exporter)
          const asset = archive.getAssetById(node.src)
          if (asset) {
            el.attr('src', asset.filename)
          } else {
            el.attr('src', '')
          }
          break
        }
        case 'mimetype': {
          // NOTE: whatever is stored here, only what the DAR says matters
          const archive = this._getArchive(exporter)
          const asset = archive.getAssetById(node.src)
          if (asset && asset.mimetype) {
            el.attr('mimetype', asset.mimetype)
          }
          break
        }
        default: {
          super._exportAttribute(propName, propSpec, node, el, exporter)
        }
      }
    }
  }
  return AssetConverter
}
