import ToolGroup from './ToolGroup'

/*
  Tool prompt

  ```
  $$(ToolPrompt, {
    name: 'prompt',
    type: 'tool-prompt',
    contextual: true,
    showDisabled: true,
    commandGroups: ['prompt']
  })
  ```
*/
export default class ToolPrompt extends ToolGroup {
  _getClassNames () {
    return 'sc-tool-prompt'
  }
}
