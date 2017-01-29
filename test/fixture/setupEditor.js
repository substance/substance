import Document from '../../model/Document'
import DocumentSchema from '../../model/DocumentSchema'
import EditorSession from '../../model/EditorSession'
import BlockNode from '../../model/BlockNode'
import InlineNode from '../../model/InlineNode'
import ParagraphPackage from '../../packages/paragraph/ParagraphPackage'
import HeadingPackage from '../../packages/heading/HeadingPackage'
import StrongPackage from '../../packages/strong/StrongPackage'
import EmphasisPackage from '../../packages/emphasis/EmphasisPackage'
import ListPackage from '../../packages/list/ListPackage'
import LinkPackage from '../../packages/link/LinkPackage'
import CodeblockPackage from '../../packages/codeblock/CodeblockPackage'
import Component from '../../ui/Component'
import AbstractEditor from '../../ui/AbstractEditor'
import ContainerEditor from '../../ui/ContainerEditor'
import Configurator from '../../util/Configurator'

export default function setupEditor(t, ...f) {
  let editor = TestEditor.mount({ editorSession: fixture(...f) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  let surface = editor.refs.surface
  return { editor, editorSession, doc, surface }
}

class TestEditor extends AbstractEditor {

  constructor(...args) {
    super(...args)
    this.handleActions({
      domSelectionRendered: function() {}
    })
  }

  render($$) {
    let doc = this.editorSession.getDocument()
    let el = $$('div')
    let body = $$(ContainerEditor, {
      node: doc.get('body')
    }).ref('surface')
    el.append(body)
    return el
  }
}

function getConfig() {
  let config = new Configurator()
  config.addToolGroup('annotations')
  config.addToolGroup('overlay')
  config.defineSchema(new DocumentSchema('test-article', 1.0, {
    defaultTextType: 'paragraph'
  }))
  config.import(ParagraphPackage)
  config.import(HeadingPackage)
  config.import(StrongPackage)
  config.import(EmphasisPackage)
  config.import(ListPackage)
  config.import(LinkPackage)
  config.import(CodeblockPackage)
  config.addNode(TestBlockNode)
  config.addNode(TestInlineNode)
  config.addComponent('test-block', Component)
  return config
}

function fixture(...args) {
  let config = getConfig()
  let doc = new Document(config.getSchema())
  let body = doc.create({
    type: 'container',
    id: 'body'
  })
  args.forEach((seed)=>{
    seed(doc, body)
  })
  let editorSession = new EditorSession(doc, { configurator: config })
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    containerId: 'body',
    surfaceId: 'body'
  })
  return editorSession
}

class TestInlineNode extends InlineNode {}
TestInlineNode.type = 'test-inline'
TestInlineNode.schema = {
  foo: { type: 'string' }
}

class TestBlockNode extends BlockNode {}
TestBlockNode.type = 'test-block'
