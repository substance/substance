import forEach from '../util/forEach'
import FontAwesomeIcon from './FontAwesomeIcon'

class FontAwesomeIconProvider {

  constructor(icons) {
    this.faMap = {}
    this.textMap = {}
    forEach(icons, function(config, name) {
      let faClass = config['fontawesome']
      if (faClass) {
        this.addFAIcon(name, faClass)
      }
      let text = config['text']
      if (text) {
        this.addTextIcon(name, text)
      }
    }.bind(this))
  }

  renderIcon($$, name) {
    let faClass = this.faMap[name]
    let text = this.textMap[name]
    if (faClass) {
      return $$(FontAwesomeIcon, { icon: faClass })
    } else if (text) {
      return text
    }
  }

  addFAIcon(name, faClass) {
    this.faMap[name] = faClass
  }

  addTextIcon(name, text) {
    this.textMap[name] = text
  }
}

export default FontAwesomeIconProvider
