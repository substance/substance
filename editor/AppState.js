import { isNil, isFunction } from '../util'
import AbstractAppState from './AbstractAppState'

const ANY = '@any'
const STAGES = ['update', 'pre-render', 'render', 'post-render', 'pre-position', 'position', 'finalize']
const DEFAULT_STAGE = 'update'
const STAGE_IDX = STAGES.reduce((m, s, idx) => {
  m[s] = idx
  return m
}, {})

export default class AppState extends AbstractAppState {
  _initialize (initialState = {}) {
    super._initialize()

    const impl = this._getImpl()
    impl.slots = new Map()
    impl.schedule = null
    impl.isFlowing = false

    const names = Object.keys(initialState)
    names.forEach(name => {
      const initialValue = initialState[name]
      this._addProperty(name, initialValue)
    })
  }

  getId () {
    return this._getImpl().id
  }

  addObserver (deps, handler, observer, options = {}) {
    if (isNil(handler)) throw new Error('Provided handler function is nil')
    if (!isFunction(handler)) throw new Error('Provided handler is not a function')
    handler = handler.bind(observer)

    const impl = this._getImpl()
    const ID = impl.id
    if (!options.stage) options.stage = DEFAULT_STAGE
    const stage = options.stage
    const slotId = this._getSlotId(stage, deps.slice())
    let slot = impl.slots.get(slotId)
    if (!slot) {
      slot = this._createSlot(slotId, stage, deps)
      impl.slots.set(slotId, slot)
    }
    if (!observer[ID]) observer[ID] = new Map()
    // console.log('Adding observer', slot, deps, stage, options)
    slot.addObserver(observer, {
      stage,
      deps,
      handler,
      options
    })
  }

  removeObserver (observer) {
    const impl = this._getImpl()
    const ID = impl.id
    const entries = observer[ID] || []
    entries.forEach(e => {
      e.slot.removeObserver(observer)
    })
    delete observer[ID]
  }

  propagateUpdates () {
    const impl = this._getImpl()
    // console.log('AppState.propagatUpdates()', impl.id)
    if (impl.isFlowing) throw new Error('Already updating.')
    impl.isFlowing = true
    try {
      const schedule = this._getSchedule()
      for (const slot of schedule) {
        if (slot.needsUpdate()) {
          slot.notifyObservers()
        }
      }
      this._reset()
    } finally {
      impl.isFlowing = false
    }
  }

  _getSlotId (stage, deps) {
    deps.sort()
    return `@${stage}:${deps.join(',')}`
  }

  _createSlot (id, stage, deps) {
    const impl = this._getImpl()
    impl.schedule = null
    return new Slot(this, id, stage, deps)
  }

  // order slots by stage
  _getSchedule () {
    const impl = this._getImpl()
    let schedule = impl.schedule
    if (!schedule) {
      schedule = []
      impl.slots.forEach(s => schedule.push(s))
      schedule.sort((a, b) => STAGE_IDX[a.stage] - STAGE_IDX[b.stage])
      impl.schedule = schedule
    }
    return schedule
  }

  _isUpdating () {
    return this._getImpl().isFlowing
  }

  _reset () {
    super._reset()
    this._setDirty(ANY)
  }
}

class Slot {
  constructor (appState, id, stage, deps) {
    this._id = appState._getImpl().id
    this.id = id
    this.appState = appState
    this.stage = stage
    this.deps = deps

    this.observers = new Set()
  }

  addObserver (observer, spec) {
    observer[this._id].set(this.id, {
      slot: this,
      spec
    })
    this.observers.add(observer)
  }

  removeObserver (observer) {
    this._deleteEntry(observer)
    this.observers.delete(observer)
  }

  needsUpdate () {
    const state = this.appState
    for (const dep of this.deps) {
      if (state.isDirty(dep)) return true
    }
    return false
  }

  notifyObservers () {
    const observers = this._getObservers()
    for (const o of observers) {
      const entry = this._getEntryForObserver(o)
      // observer might have been disposed in the meantime
      if (!entry) continue
      this._notifyObserver(entry)
    }
  }

  _getObservers () {
    return this.observers
  }

  _getEntryForObserver (observer) {
    const map = observer[this._id]
    if (map) {
      return map.get(this.id)
    }
  }

  _deleteEntry (observer) {
    const map = observer[this._id]
    if (map) {
      map.delete(this.id)
    }
  }

  _notifyObserver (entry) {
    entry.spec.handler()
  }
}
