import { isFunction } from '../util'

export default class ApiExtension {
  constructor () {
    // initialized by _register
    this.api = null
  }

  _register (api) {
    this.api = api

    const propNames = Object.getOwnPropertyNames(this.constructor.prototype)
    for (const propName of propNames) {
      if (propName === 'constructor') continue
      if (/^_/.exec(propName)) continue
      const prop = this[propName]
      if (isFunction(prop)) {
        // TODO: maybe disallow to overwrite an existing method
        api[propName] = prop.bind(this)
      }
    }
  }
}
