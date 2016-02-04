'use strict';

var oo = require('../util/oo');
var each = require('lodash/each');
var TreeIndex = require('../util/TreeIndex');

var PathEventProxy = function(doc) {
  this.listeners = new TreeIndex.Arrays();
  this._list = [];
  this.doc = doc;
};

PathEventProxy.Prototype = function() {

  this.onDocumentChanged = function(change, info, doc) {
    // stop if no listeners registered
    if (this._list.length === 0) {
      return;
    }
    var listeners = this.listeners;
    change.updated.forEach(function(_, path) {
      var scopedListeners = listeners.get(path);
      each(scopedListeners, function(entry) {
        entry.method.call(entry.listener, change, info, doc);
      });
    }.bind(this));
  };

  this._add = function(path, listener, method) {
    if (!method) {
      throw new Error('Invalid argument: expected function but got ' + method);
    }
    var entry = { path: path, method: method, listener: listener };
    this.listeners.add(path, entry);
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
        this.listeners.remove(entry.path, entry);
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

oo.initClass(PathEventProxy);

module.exports = PathEventProxy;
