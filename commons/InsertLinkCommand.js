import { AnnotationCommand } from '../editor'

export default class InsertLinkCommand extends AnnotationCommand {
  executeCreate (params, context) {
    // Note: link modal specific to Essay Editor,
    // so we are sending an action directly there
    context.editorSession.getRootComponent().send('insertLinkModal')
  }
}
