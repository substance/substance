import { Overlay } from '../../ui'

export default {
  name: 'overlay',
  configure: function(config) {
    config.addToolGroup('overlay')
    config.addComponent('overlay', Overlay)
  }
}
