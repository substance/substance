import { Overlay } from '../../deprecated'

export default {
  name: 'overlay',
  configure: function (config) {
    config.addComponent('overlay', Overlay)
  }
}
