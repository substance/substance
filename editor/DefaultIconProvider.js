import { $$ } from '../dom'
import FontAwesomeIcon from './FontAwesomeIcon'

export default class IconProvider {
  constructor (config) {
    this.config = config
  }

  renderIcon (name) {
    let spec = this._getIconDef(name)
    if (!spec) {
      // throw new Error(`No icon found for name '${name}'`)
      return null
    } else {
      if (spec['fontawesome']) {
        return $$(FontAwesomeIcon, { icon: spec['fontawesome'] })
      } else {
        throw new Error('Unsupported icon spec')
      }
    }
  }

  _getIconDef (name) {
    return this.config._iconRegistry.get(name)
  }
}
