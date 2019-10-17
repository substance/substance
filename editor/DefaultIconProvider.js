import { $$ } from '../dom'
import FontAwesomeIcon from './FontAwesomeIcon'

export default class DefaultIconProvider {
  constructor (config) {
    this.config = config
  }

  renderIcon (name) {
    let spec = this._getIconDef(name)
    if (!spec) {
      return $$('span')
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
