import Component from './Component'
import MenuItem from './MenuItem'

/*
  Usage:

  ```
  $$(Menu, {
    items: [
      { command: 'heading1' },
      { command: 'heading2' },
      { type: 'separator' },
      { type: 'heading3' },
    ]
  })
  ```
*/
class Menu extends Component {
  render ($$) {
    let commandState = this.props.commandStates
    let el = $$('div').addClass('sc-menu')
    this.props.items.forEach((item) => {
      if (item.command) {
        el.append(
          $$(MenuItem, {
            name: item.command,
            commandState: commandState[item.command]
          })
        )
      } else if (item.type === 'separator') {
        el.append(
          $$('div').addClass('separator')
        )
      }
    })
    return el
  }
}

export default Menu
