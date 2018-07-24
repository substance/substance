import { ContextMenu } from '../../deprecated'

export default {
  name: 'context-menu',
  configure: function (config) {
    config.addComponent('context-menu', ContextMenu)
  }
}
