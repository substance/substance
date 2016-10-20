import Gutter from './Gutter'

export default {
  name: 'gutter',
  configure: function(config) {
    config.addToolGroup('gutter')
    config.addComponent('gutter', Gutter)
  }
}
