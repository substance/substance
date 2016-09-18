import Prompt from './Prompt'

export default {
  name: 'prompt',
  configure: function(config) {
    config.addComponent('prompt', Prompt)
  }
}
