import forEach from '../util/forEach'
import isString from '../util/isString'
import FontAwesomeIcon from './FontAwesomeIcon'

export default class FontAwesomeIconProvider {

  constructor(icons) {
    this.faMap = {}
    this.textMap = {}
    forEach(icons, (config, name) => {
      let faConfig = config['fontawesome']
      if (faConfig) {
        if (isString(faConfig)) {
          faConfig = { icon: faConfig }
        }
        this.addFAIcon(name, faConfig)
      }
      let text = config['text']
      if (text) {
        this.addTextIcon(name, text)
      }
    })
  }

  renderIcon($$, name) {
    let faProps = this.faMap[name]
    let text = this.textMap[name]
    if (faProps) {
      return $$(FontAwesomeIcon, faProps)
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
