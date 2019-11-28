import { uuid, isObject } from '../util'

const IMPL = Symbol('__AppStateImpl__')

export default class AbstractAppState {
  constructor (...args) {
    this[IMPL] = new AppStateImpl()
    // console.log('Created AppState', this.getId())

    this._initialize(...args)
    this._reset()
  }

  _initialize () {
    // nothing to initialize on this level
  }

  dispose () {}

  isDirty (name) {
    return this._getImpl().isDirty(name)
  }

  _get (name) {
    return this._getImpl().get(name)
  }

  _set (name, value) {
    const impl = this._getImpl()
    const oldVal = impl.get(name)
    let hasChanged
    if (isObject(value)) {
      hasChanged = true
    } else {
      hasChanged = oldVal !== value
    }
    if (hasChanged) {
      impl.set(name, value)
      impl.setDirty(name)
    }
  }

  getUpdate (name) {
    return this._getImpl().getUpdate(name)
  }

  addObserver (deps, handler, observer, options = {}) { // eslint-disable-line no-unused-vars
    throw new Error('This method is abstract.')
  }

  removeObserver (observer) { // eslint-disable-line no-unused-vars
    throw new Error('This method is abstract.')
  }

  off (observer) {
    this.removeObserver(observer)
  }

  propagateUpdates () {
    throw new Error('This method is abstract.')
  }

  _getImpl () {
    return this[IMPL]
  }

  _addProperty (name, initialValue) {
    const impl = this._getImpl()
    if (impl.has(name)) {
      throw new Error(`State variable '${name}' is already declared.`)
    }
    impl.set(name, initialValue)
    // TODO: don't know if that will be working with mangling
    // IMO the code using the prop will be mangled
    // but not this definition
    Object.defineProperty(this, name, {
      configurable: false,
      enumerable: false,
      get: () => { return this._get(name) },
      set: (value) => { this._set(name, value) }
    })
  }

  // TODO: we should not need this on the long run
  // for now we use it to allow some hackz
  _setDirty (name) {
    this._getImpl().setDirty(name)
  }

  _setUpdate (name, update) {
    const impl = this._getImpl()
    impl.setUpdate(name, update)
    impl.setDirty(name)
  }

  _reset () {
    this._getImpl().reset()
  }
}

export class AppStateImpl {
  constructor () {
    this.id = uuid()
    this.values = new Map()
    this.dirty = new Set()
    this.updates = new Map()
  }

  get (name) {
    return this.values.get(name)
  }

  set (name, newValue) {
    this.values.set(name, newValue)
  }

  has (name) {
    return this.values.has(name)
  }

  setDirty (name) {
    this.dirty.add(name)
  }

  isDirty (name) {
    return this.dirty.has(name)
  }

  getUpdate (name) {
    return this.updates.get(name)
  }

  setUpdate (name, update) {
    this.updates.set(name, update)
  }

  reset () {
    this.dirty.clear()
    this.updates.clear()
  }
}
