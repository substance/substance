'use strict';

var EventEmitter = require('../util/EventEmitter');
var each = require('lodash/collection/each');
var without = require('lodash/array/without');

/**
  Manages highlights. Used by {@link ui/ScrollPane}.

  @class

  @param {model/Document} doc document instance

  @example
  
  ```
  var contentHighlights = new Highlights(doc);
  ```
*/

var Highlights = function(doc) {
  EventEmitter.apply(this, arguments);

  this.doc = doc;
  this._highlights = {};
};

Highlights.Prototype = function() {

  /**
    Get currently active highlights.

    @return {Object} Returns current highlights as a scoped object.
  */
  this.get = function() {
    return this._highlights;
  };
  
  /**
    Set highlights.

    @param {Object} scoped object describing highlights

    @example

    ```js
      highlights.set({
        'figures': ['figure-1', 'figure-3']
        'citations': ['citation-1', 'citation-5']
      });
    ```
  */
  this.set = function(highlights) {
    var oldHighlights = this._highlights;
    var doc = this.doc;
    // Iterate over scopes of provided highlights
    each(highlights, function(newScopedHighlights, scope) {
      var oldScopedHighlights = oldHighlights[scope] || [];

      // old [1,2,3]  -> new [2,4,5]
      // toBeDeleted: [1,3]
      // toBeAdded:   [4,5]
      var toBeDeleted = without(oldScopedHighlights, newScopedHighlights);
      var toBeAdded = without(newScopedHighlights, oldScopedHighlights);

      // if (scopedHighlights) {
      each(toBeDeleted, function(nodeId) {
        var node = doc.get(nodeId);
        // Node could have been deleted in the meanwhile
        if (node) {
          node.setHighlighted(false, scope);
        }
      }.bind(this));

      each(toBeAdded, function(nodeId) {
        var node = doc.get(nodeId);
        node.setHighlighted(true, scope);
      }.bind(this));
    }.bind(this));

    this._highlights = highlights;
    this.emit('highlights:updated', highlights);
  };
};

/**
  Emitted when highlights have been updated

  @event ui/Highlights@highlights:updated
*/

EventEmitter.extend(Highlights);

module.exports = Highlights;