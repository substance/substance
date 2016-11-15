import Overlay from './Overlay'

export default {
  name: 'overlay',
  configure: function(config) {
    config.addToolGroup('overlay')
    config.addComponent('overlay', Overlay)
  }
}
