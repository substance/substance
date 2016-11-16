import ContextMenu from './ContextMenu'

export default {
  name: 'context-menu',
  configure: function(config) {
    config.addComponent('context-menu', ContextMenu)
  }
}
