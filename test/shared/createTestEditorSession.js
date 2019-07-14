import { EditorSession, createEditorContext } from 'substance'
import getTestConfig from './getTestConfig'
import createTestArticle from './createTestArticle'

export default function createTestEditorSession (...seeds) {
  let config = getTestConfig()
  let doc = createTestArticle()
  let body = doc.get('body')
  seeds.forEach(seed => seed(doc, body))

  let editorSession = new EditorSession('test', doc, config)
  let context = createEditorContext(config, editorSession)
  editorSession.setContext(context)

  let first = body.getNodeAt(0)
  if (first) {
    if (first.isText()) {
      editorSession.setSelection({
        type: 'property',
        path: first.getPath(),
        startOffset: 0,
        containerPath: ['body', 'nodes'],
        surfaceId: 'body'
      })
    } else if (first.isList()) {
      editorSession.setSelection({
        type: 'property',
        path: first.getItemAt(0).getPath(),
        startOffset: 0,
        containerPath: ['body', 'nodes'],
        surfaceId: 'body'
      })
    } else {
      editorSession.setSelection({
        type: 'node',
        nodeId: first.id,
        mode: 'before',
        containerPath: ['body', 'nodes'],
        surfaceId: 'body'
      })
    }
  }
  return editorSession
}
