import { Overlay } from '../../ui'

export default {
  name: 'overlay',
  configure: function(config) {
    config.addComponent('overlay', Overlay)
  }
}
