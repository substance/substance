'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var PathAdapter = require('../basics/path_adapter');

var NotifyByPathProxy = function(doc) {
  this.listeners = new PathAdapter();
  this._list = [];
  this.doc = doc;
};

NotifyByPathProxy.Prototype = function() {

  this.onDocumentChanged = function(change, info, doc) {
    var listeners = this.listeners;
    var updated = change.updated;

    function _updated(path, op) {
      if (!change.deleted[path[0]]) {
        updated.add(path, op);
      }
    }

    function _updatedContainerAnno(containerId, startPath, endPath, op) {
      var container = doc.get(containerId);
      var startComp = container.getComponent(startPath);
      var endComp = container.getComponent(endPath);
      if (startComp && endComp) {
        var startIdx = startComp.getIndex();
        var endIdx = endComp.getIndex();
        var comp = startComp;
        for (var i = startIdx; comp && i <= endIdx; i++, comp = comp.getNext()) {
          _updated(comp.getPath(), op);
        }
      } else {
        _updated(startPath, op);
        _updated(endPath, op);
      }
    }

    _.each(change.ops, function(op) {
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
    }, this);
    change.traverse(function(path) {
      var key = path.concat(['listeners']);
      var scopedListeners = listeners.get(key);
      _.each(scopedListeners, function(entry) {
        entry.method.call(entry.listener, change, info, doc);
      });
    }, this);
  };

  this.add = function(path, listener, method) {
    var key = path.concat(['listeners']);
    var listeners = this.listeners.get(key);
    if (!listeners) {
      listeners = [];
      this.listeners.set(key, listeners);
    }
    if (!method) {
      throw new Error('Invalid argument: expected function but got ' + method);
    }
    listeners.push({ method: method, listener: listener });
  };

  this.connect = function(listener, path, method) {
    this.add(path, listener, method);
  };

  // TODO: it would be cool if we would just need to provide the listener instance, no path
  this.remove = function(path, listener) {
    var key = path.concat(['listeners']);
    var listeners = this.listeners.get(key);
    if (listeners) {
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i].listener === listener) {
          listeners.splice(i, 1);
          return;
        }
      }
    }
  };

  this.disconnect = function(listener, path) {
    this.remove(path, listener);
  };

};

OO.initClass(NotifyByPathProxy);

module.exports = NotifyByPathProxy;
