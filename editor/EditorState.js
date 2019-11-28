import { getKeyForPath } from '../util'
import AppState from './AppState'
import SelectionStateReducer from './SelectionStateReducer'
import DocumentObserver from './DocumentObserver'

const ANY = '@any'
const NOP = function (doc) {
  return doc._createDocumentChange([], {}, {}, { action: 'nop' })
}

export default class EditorState extends AppState {
  _initialize (initialState) {
    super._initialize(initialState)

    if (!initialState.document) {
      throw new Error("'document' is required")
    }
    const doc = initialState.document
    const impl = this._getImpl()
    // EXPERIMENTAL:
    // one observer for all slots that watches for document changes and marks paths as dirty
    // this is also used to broadcast other node based changes such as node state updates
    const documentObserver = new DocumentObserver(doc, this)
    impl.documentObserver = documentObserver

    const selectionStateReducer = new SelectionStateReducer(this)
    selectionStateReducer.update()
    impl._selectionStateReducer = selectionStateReducer
  }

  // Call this to revitalise a previously disposed editor state
  init () {
    this._getImpl().documentObserver.init()
  }

  dispose () {
    super.dispose()

    this._getImpl().documentObserver.dispose()
  }

  getUpdate (name) {
    let update = super.getUpdate(name)
    // HACK: sometimes we fake a document change to trigger document observers
    // In this case, there might be no actual update (change and info)
    // and we provide a NOP change and empty info
    if (!update && name === 'document') {
      const change = NOP(this._get('document'))
      change._extractInformation()
      update = { change, info: change.info }
    }
    return update
  }

  _createSlot (id, stage, deps) {
    const impl = this._getImpl()
    impl.schedule = null
    if (deps.indexOf('document') !== -1) {
      return new DocumentSlot(this, id, stage, deps, impl.documentObserver)
    } else {
      return new Slot(this, id, stage, deps)
    }
  }

  _reset () {
    super._reset()
    this._getImpl().documentObserver.reset()
  }

  _getDocumentObserver () {
    return this._getImpl().documentObserver
  }
}

class Slot {
  constructor (editorState, id, stage, deps) {
    this._id = editorState._getImpl().id
    this.id = id
    this.editorState = editorState
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
    const state = this.editorState
    for (const dep of this.deps) {
      if (state.isDirty(dep)) return true
    }
    return false
  }

  notifyObservers () {
    const observers = this._getObservers()
    // console.log('Slot.notifyObservers()', observers, this.deps)
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
    const entries = observer[this._id]
    if (entries) {
      return entries.get(this.id)
    }
  }

  _deleteEntry (observer) {
    const entries = observer[this._id]
    if (entries) {
      entries.delete(this.id)
    }
  }

  _getDocumentChange () {
    const { change, info } = this._updates.document
    change.info = info
    return change
  }

  _notifyObserver (entry) {
    const state = this.editorState
    const spec = entry.spec
    // TODO: we want to drop this auto-arguments completely
    // after having switched to a pure AppState based implementation
    // i.e. without using observers via EditorSession
    if (spec.deps.length === 1) {
      const name = spec.deps[0]
      switch (name) {
        case 'document': {
          const update = state.getUpdate('document') || {}
          spec.handler(update.change, update.info)
          break
        }
        default:
          spec.handler(state._get(name))
      }
    } else {
      spec.handler()
    }
  }
}

class DocumentSlot extends Slot {
  constructor (editorState, id, stage, deps, documentObserver) {
    super(editorState, id, stage, deps)

    this.documentObserver = documentObserver
    this.byPath = { '@any': new Set() }
  }

  addObserver (observer, spec) {
    super.addObserver(observer, spec)

    const index = this.byPath
    const docSpec = spec.options.document
    if (docSpec && docSpec.path) {
      const key = getKeyForPath(docSpec.path)
      let records = index[key]
      if (!records) {
        records = index[key] = new Set()
      }
      records.add(observer)
    } else {
      index[ANY].add(observer)
    }
  }

  removeObserver (observer) {
    const entries = observer[this._id]
    if (entries) {
      const entry = entries.get(this.id)
      const index = this.byPath
      super.removeObserver(observer)
      const docSpec = entry.spec.options.document
      if (docSpec && docSpec.path) {
        const key = getKeyForPath(docSpec.path)
        const records = index[key]
        records.delete(observer)
      } else {
        index[ANY].delete(observer)
      }
    }
  }

  _getObservers () {
    const state = this.editorState
    if (!state.isDirty('document')) return this.observers

    // notify all observers that are affected by the change
    const index = this.byPath
    const { change } = state.getUpdate('document')

    if (!change) {
      console.error('FIXME: expected to find a document change as update for document')
      return index[ANY]
    }

    const updated = this.documentObserver.dirty
    const sets = []
    // observers without a path spec are registered with path=undefined
    sets.push(index[ANY])
    updated.forEach(id => {
      const set = index[id]
      if (set) sets.push(set)
    })
    const observers = new Set()
    sets.forEach(s => {
      s.forEach(o => observers.add(o))
    })
    return observers
  }
}
