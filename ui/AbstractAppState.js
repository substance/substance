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

  get (name) {
    return this._getImpl().get(name)
  }

  set (name, value, propagateImmediately) {
    const impl = this._getImpl()
    let oldVal = impl.get(name)
    let hasChanged
    if (isObject(value)) {
      hasChanged = true
    } else {
      hasChanged = oldVal !== value
    }
    if (hasChanged) {
      impl.set(name, value)
      impl.setDirty(name)
      if (propagateImmediately) {
        this.propagateUpdates()
      }
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
    Object.defineProperty(this, name, {
      configurable: false,
      enumerable: false,
      get: () => { return this.get(name) },
      set: (value) => { this.set(name, value) }
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
    this.dirty = {}
    this.updates = {}
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
    this.dirty[name] = true
  }

  isDirty (name) {
    return Boolean(this.dirty[name])
  }

  getUpdate (name) {
    return this.updates[name]
  }

  setUpdate (name, update) {
    this.updates[name] = update
  }

  reset () {
    this.dirty = {}
    this.updates = {}
  }
}
