import { test } from 'substance-test'
import simple from './fixture/simple'
import setupEditor from './fixture/setupEditor'

test('CommandManager: Command state changing with selection', (t) => {
  let { editorSession } = setupEditor(t, simple)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })

  let commandStates = editorSession.getCommandStates()
  t.equal(commandStates.paragraph.active, true, 'Paragraph should be active for collapsed selection')
  t.equal(commandStates.paragraph.disabled, false, 'Paragraph should not be disabled for collapsed selection')
  t.equal(commandStates.strong.active, false, 'Strong should not be active for collapsed selection')
  t.equal(commandStates.strong.disabled, true, 'Strong should be disabled for collapsed selection')
  t.end()

  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 4,
    containerId: 'body'
  })

  commandStates = editorSession.getCommandStates()
  t.equal(commandStates.strong.active, false, 'Strong should not be active for non-collapsed selection without strong annotation')
  t.equal(commandStates.strong.disabled, false, 'Strong should not be disabled for non-collapsed selection')
})
