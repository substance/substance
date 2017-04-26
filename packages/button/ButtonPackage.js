import Button from './Button'

export default {
  name: 'button',
  configure: function(config) {
    config.addComponent('button', Button)

    config.addIcon('dropdown', { 'fontawesome': 'fa-angle-down' })
  }
}
