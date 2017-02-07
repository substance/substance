import Document from '../../model/Document'
import EditorSession from '../../model/EditorSession'
import getTestConfig from './getTestConfig'

export default function createEditorSession(...args) {
  let config = getTestConfig()
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
