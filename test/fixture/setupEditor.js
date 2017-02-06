import Document from '../../model/Document'
import DocumentSchema from '../../model/DocumentSchema'
import EditorSession from '../../model/EditorSession'
import BlockNode from '../../model/BlockNode'
import ParagraphPackage from '../../packages/paragraph/ParagraphPackage'
import HeadingPackage from '../../packages/heading/HeadingPackage'
import StrongPackage from '../../packages/strong/StrongPackage'
import EmphasisPackage from '../../packages/emphasis/EmphasisPackage'
import ListPackage from '../../packages/list/ListPackage'
import LinkPackage from '../../packages/link/LinkPackage'
import TablePackage from '../../packages/table/TablePackage'
import CodeblockPackage from '../../packages/codeblock/CodeblockPackage'
import Component from '../../ui/Component'
import AbstractEditor from '../../ui/AbstractEditor'
import ContainerEditor from '../../ui/ContainerEditor'
import Configurator from '../../util/Configurator'
import InlineWrapper from '../../packages/inline-wrapper/InlineWrapper'
import InlineWrapperComponent from '../../packages/inline-wrapper/InlineWrapperComponent'
import TestContainerAnnotation from './TestContainerAnnotation'
import TestStructuredNode from './TestStructuredNode'
import TestStructuredNodeComponent from './TestStructuredNodeComponent'
import TestInlineNode from './TestInlineNode'
import TestInlineNodeComponent from './TestInlineNodeComponent'
import TestContainerComponent from './TestContainerComponent'

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
  config.addToolGroup('default')
  config.addToolGroup('annotations')
  config.addToolGroup('overlay')
  config.defineSchema(new DocumentSchema('test-article', 1.0, {
    defaultTextType: 'paragraph'
  }))
  config.import(ParagraphPackage)
  config.import(HeadingPackage)
  config.import(StrongPackage)
  config.import(EmphasisPackage)
  config.import(LinkPackage)
  config.import(ListPackage)
  config.import(TablePackage)
  config.import(CodeblockPackage)
  config.addNode(TestBlockNode)
  config.addNode(TestInlineNode)
  config.addNode(TestContainerAnnotation)
  config.addNode(TestStructuredNode)
  config.addNode(InlineWrapper)
  config.addComponent('test-block', Component)
  config.addComponent('test-inline-node', TestInlineNodeComponent)
  config.addComponent('structured-node', TestStructuredNodeComponent)
  config.addComponent('container', TestContainerComponent)
  config.addComponent(InlineWrapper.type, InlineWrapperComponent)
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
  let first = body.getNodeAt(0)
  if (first) {
    if (first.isText()) {
      editorSession.setSelection({
        type: 'property',
        path: first.getTextPath(),
        startOffset: 0,
        containerId: 'body',
        surfaceId: 'body'
      })
    } else if (first.isList()) {
      editorSession.setSelection({
        type: 'property',
        path: first.getItemAt(0).getTextPath(),
        startOffset: 0,
        containerId: 'body',
        surfaceId: 'body'
      })
    } else {
      editorSession.setSelection({
        type: 'node',
        nodeId: first.id,
        mode: 'before',
        containerId: 'body',
        surfaceId: 'body'
      })
    }
  }
  return editorSession
}

class TestBlockNode extends BlockNode {}
TestBlockNode.type = 'test-block'
