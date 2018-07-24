import ToolGroup from './DeprecatedToolGroup'

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
export default class DeprecatedToolPrompt extends ToolGroup {
  _getClassNames () {
    return 'sc-tool-prompt'
  }
}
