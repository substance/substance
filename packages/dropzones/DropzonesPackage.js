import Dropzones from './Dropzones'

export default {
  name: 'dropzones',
  configure: function(config) {
    config.addComponent('dropzones', Dropzones)
  }
}
