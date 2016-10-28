import Blocker from './Blocker'

export default {
  name: 'blocker',
  configure: function(config) {
    config.addComponent("blocker", Blocker)
  }
}
