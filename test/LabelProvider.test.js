import { test } from 'substance-test'
import {
  Configurator, EditorSession, Document, DocumentSchema, AbstractEditor, forEach
} from 'substance'
import getMountPoint from './fixture/getMountPoint'

test('LabelProvider: get label', t => {
  let configurator = _simple()
  let editorSession = _createEditorSession(configurator)
  let editor = Editor1.mount({ editorSession }, getMountPoint(t))
  let el = editor.getElement()
  let fox = el.find('.fox')
  t.equal(fox.textContent, 'Fox', 'label should have been provided')
  t.end()
})

test('LabelProvider: get translated label', t => {
  let configurator = _simple()
  let editorSession = _createEditorSession(configurator)
  editorSession.setLanguage('de')
  let editor = Editor1.mount({ editorSession }, getMountPoint(t))
  let el = editor.getElement()
  let fox = el.find('.fox')
  t.equal(fox.textContent, 'Fuchs', 'translated label should have been provided')
  t.end()
})

test('LabelProvider: expand label with vars', t => {
  let configurator = _items()
  let editorSession = _createEditorSession(configurator)
  let editor = Editor2.mount({ editorSession }, getMountPoint(t))
  let el = editor.getElement()
  let msg = el.find('.msg')
  t.equal(msg.textContent, '5 items found', 'label should have been expanded')
  t.end()
})

test('LabelProvider: custom label provider', t => {
  let configurator = _custom()
  let editorSession = _createEditorSession(configurator)
  let editor = Editor2.mount({ editorSession }, getMountPoint(t))
  let el = editor.getElement()
  let msg = el.find('.msg')
  t.equal(msg.textContent, 'n_items_found@n=5@en', 'custom label should have been provided')
  t.end()
})

test('LabelProvider: switch language', t => {
  let configurator = _simple()
  let editorSession = _createEditorSession(configurator)
  let editor = Editor1.mount({ editorSession }, getMountPoint(t))
  let el = editor.getElement()
  let fox = el.find('.fox')
  t.equal(fox.textContent, 'Fox', 'label should have been provided')
  // this should trigger a rerender on Editor
  editorSession.setLanguage('de')
  t.equal(fox.textContent, 'Fuchs', 'translated label should have been provided')
  t.end()
})

function _simple () {
  let config = new Configurator()
  config.addLabel('fox', {
    en: 'Fox',
    de: 'Fuchs'
  })
  return config
}

function _items () {
  let config = new Configurator()
  config.addLabel('n_items_found', {
    en: '${n} items found' // eslint-disable-line no-template-curly-in-string
  })
  return config
}

function _custom () {
  let config = new Configurator()
  config.setLabelProviderClass(CustomLabelProvider)
  config.addLabel('fox', {
    en: 'Fox',
    de: 'Fuchs'
  })
  return config
}

function _createEditorSession (configurator) {
  let schema = new DocumentSchema({ name: 'stub', version: '1', DocumentClass: Document })
  let doc = new Document(schema)
  let editorSession = new EditorSession(doc, { configurator })
  return editorSession
}

class Editor1 extends AbstractEditor {
  render ($$) {
    return $$('div').append(
      $$('div').addClass('fox').text(this.getLabel('fox')).ref('label')
    )
  }
}

class Editor2 extends AbstractEditor {
  render ($$) {
    return $$('div').append(
      $$('div').addClass('msg').text(this.getLabel('n_items_found', { n: 5 })).ref('label')
    )
  }
}

// just for demonstration
class CustomLabelProvider {
  constructor (labels, lang) {
    this.lang = lang || 'en'
    this.labels = labels
  }

  getLabel (name, params) {
    let parts = [name]
    forEach(params, (val, key) => {
      parts.push(key + '=' + val)
    })
    parts.push(this.lang)
    return parts.join('@')
  }

  setLanguage (lang) {
    this.lang = lang || 'en'
  }
}
