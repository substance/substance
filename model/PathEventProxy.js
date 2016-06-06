'use strict';

var forEach = require('lodash/forEach');
var isEqual = require('lodash/isEqual');
var oo = require('../util/oo');
var TreeIndex = require('../util/TreeIndex');

function PathEventProxy(doc) {
  this.listeners = new TreeIndex.Arrays();
  this._list = [];
  this.doc = doc;
}

PathEventProxy.Prototype = function() {

  this.on = function(path, method, context) {
    this._add(context, path, method);
  };

  // proxy.off(this)
  // proxy.off(this, path)
  // proxy.off(this, path, this.onPropertyUpdate)
  this.off = function(context, path, method) {
    this._remove(context, path, method);
  };

  this.connect = function(listener, path, method) {
    console.warn('DEPRECATED: use proxy.on(path, this.onPropertyChange, this) instead');
    this.on(path, method, listener);
  };

  this.disconnect = function(listener) {
    console.warn('DEPRECATED: use proxy.off(this) instead');
    this.off(listener);
  };

  this.onDocumentChanged = function(change, info, doc) {
    // stop if no listeners registered
    if (this._list.length === 0) {
      return;
    }
    var listeners = this.listeners;
    forEach(change.updated, function(_, pathStr) {
      var scopedListeners = listeners.get(pathStr.split(','));
      forEach(scopedListeners, function(entry) {
        entry.method.call(entry.listener, change, info, doc);
      });
    });
  };

  this._add = function(listener, path, method) {
    if (!method) {
      throw new Error('Invalid argument: expected function but got ' + method);
    }
    var entry = { listener: listener, path: path, method: method };
    this.listeners.add(path, entry);
    this._list.push(entry);
  };

  this._remove = function(listener, path, method) {
    for (var i = 0; i < this._list.length; i++) {
      var item = this._list[i];
      var match = (
        (!path || isEqual(item.path, path)) &&
        (!listener || item.listener === listener) &&
        (!method || item.method !== method)
      );
      if (match) {
        var entry = this._list[i];
        this._list.splice(i, 1);
        this.listeners.remove(entry.path, entry);
      }
    }
  };

};

oo.initClass(PathEventProxy);

module.exports = PathEventProxy;
