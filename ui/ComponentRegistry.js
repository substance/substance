import { Registry } from '../util'

class ComponentRegistry extends Registry {
  constructor(entries) {
    super(entries, function(ComponentClass) {
      if (!ComponentClass.prototype._isComponent) {
        throw new Error('Component registry: wrong type. Expected a ComponentClass. Was: ' + String(ComponentClass))
      }
    })
  }
}

export default ComponentRegistry
