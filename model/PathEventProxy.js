import isEqual from '../util/isEqual'
import forEach from '../util/forEach'
import isArray from '../util/isArray'
import TreeIndex from '../util/TreeIndex'

class PathEventProxy {

  constructor(doc) {
    this.listeners = new TreeIndex.Arrays()
    this._list = []
    this.doc = doc
  }

  on(path, method, context) {
    this._add(context, path, method)
  }

  // proxy.off(this)
  // proxy.off(this, path)
  // proxy.off(this, path, this.onPropertyUpdate)
  off(context, path, method) {
    this._remove(context, path, method)
  }

  connect(listener, path, method) {
    console.warn('DEPRECATED: use proxy.on(path, this.onPropertyChange, this) instead')
    this.on(path, method, listener)
  }

  disconnect(listener) {
    console.warn('DEPRECATED: use proxy.off(this) instead')
    this.off(listener)
  }

  onDocumentChanged(change, info, doc) {
    // stop if no listeners registered
    if (this._list.length === 0) {
      return
    }
    var listeners = this.listeners
    forEach(change.updated, function(_, pathStr) {
      var scopedListeners = listeners.get(pathStr.split(','))
      if (isArray(scopedListeners)) scopedListeners = scopedListeners.slice(0)
      forEach(scopedListeners, function(entry) {
        entry.method.call(entry.listener, change, info, doc)
      })
    })
  }

  _add(listener, path, method) {
    if (!method) {
      throw new Error('Invalid argument: expected function but got ' + method)
    }
    var entry = { listener: listener, path: path, method: method }
    this.listeners.add(path, entry)
    this._list.push(entry)
  }

  _remove(listener, path, method) {
    for (var i = 0; i < this._list.length; i++) {
      var item = this._list[i]
      var match = (
        (!path || isEqual(item.path, path)) &&
        (!listener || item.listener === listener) &&
        (!method || item.method !== method)
      )
      if (match) {
        var entry = this._list[i]
        this._list.splice(i, 1)
        this.listeners.remove(entry.path, entry)
      }
    }
  }
}

export default PathEventProxy
