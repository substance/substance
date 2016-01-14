'use strict';

var oo = require('../util/oo');
var each = require('lodash/collection/each');
var PathAdapter = require('../util/PathAdapter');
var deleteFromArray = require('../util/deleteFromArray');


var NotifyByPathProxy = function(doc) {
  this.listeners = new PathAdapter();
  this._list = [];
  this.doc = doc;
};

NotifyByPathProxy.Prototype = function() {

  this.onDocumentChanged = function(change, info, doc) {
    // stop if no listeners registered
    if (this._list.length === 0) {
      return;
    }

    var listeners = this.listeners;
    var updated = change.updated;

    function _updated(path, op) {
      if (!change.deleted[path[0]]) {
        updated.add(path, op);
      }
    }

    function _updatedContainerAnno(containerId, startPath, endPath, op) {
      var container = doc.get(containerId);
      var paths = container.getPathRange(startPath, endPath);
       // mark all affected paths as updated
      for (var i = 0; i < paths.length; i++) {
        _updated(paths[i], op);
      }
    }

    change.ops.forEach(function(op) {
      if ( (op.type === "create" || op.type === "delete") && (op.val.path || op.val.startPath)) {
        if (op.val.path) {
          _updated(op.val.path, op);
        } else if (op.val.startPath) {
          _updatedContainerAnno(op.val.container, op.val.startPath, op.val.endPath, op);
        }
      }
      else if (op.type === "set" && (op.path[1] === "path" || op.path[1] === "startPath" || op.path[1] === "endPath")) {
        _updated(op.val, op);
        _updated(op.original, op);
      }
      else if (op.type === "set" && (op.path[1] === "startOffset" || op.path[1] === "endOffset")) {
        var anno = this.doc.get(op.path[0]);
        if (anno) {
          if (anno.path) {
            _updated(anno.path, op);
          } else {
            _updatedContainerAnno(anno.container, anno.startPath, anno.endPath, op);
          }
        }
      }
    }.bind(this));
    change.updated.traverse(function(path) {
      var key = path.concat(['listeners']);
      var scopedListeners = listeners.get(key);
      each(scopedListeners, function(entry) {
        entry.method.call(entry.listener, change, info, doc);
      });
    }.bind(this));
  };

  this._add = function(path, listener, method) {
    var key = path.concat(['listeners']);
    var listeners = this.listeners.get(key);
    if (!listeners) {
      listeners = [];
      this.listeners.set(key, listeners);
    }
    if (!method) {
      throw new Error('Invalid argument: expected function but got ' + method);
    }
    var entry = { path: path, method: method, listener: listener };
    listeners.push(entry);
    this._list.push(entry);
  };

  this.connect = function(listener, path, method) {
    this._add(path, listener, method);
  };

  this.disconnect = function(listener) {
    for (var i = 0; i < this._list.length; i++) {
      if (this._list[i].listener === listener) {
        var entry = this._list[i];
        this._list.splice(i, 1);
        var key = entry.concat(['listeners']);
        var listeners = this.listeners.get(key);
        deleteFromArray(listeners, entry);
      }
    }
  };

  this.add = function(path, listener, method) {
    console.warn('DEPRECATED: use PathEventProxy#connect(this, path, method) instead.');
    return this._add(path, listener, method);
  };

  this.remove = function(path, listener) {
    console.warn('DEPRECATED: use PathEventProxy#disconnect(this) instead.');
    this.disconnect(listener);
  };

};

oo.initClass(NotifyByPathProxy);

module.exports = NotifyByPathProxy;
