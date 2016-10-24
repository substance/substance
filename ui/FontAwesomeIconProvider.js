import forEach from '../util/forEach'
import Icon from './FontAwesomeIcon'

class FontAwesomeIconProvider {

  constructor(icons) {
    this.map = {}
    forEach(icons, function(config, name) {
      let faClass = config['fontawesome']
      if (faClass) {
        this.addIcon(name, faClass)
      }
    }.bind(this))
  }

  renderIcon($$, name) {
    let iconClass = this.map[name]
    if (iconClass) {
      return $$(Icon, {icon:iconClass})
    }
  }

  addIcon(name, faClass) {
    this.map[name] = faClass
  }
}

export default FontAwesomeIconProvider
