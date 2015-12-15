'use strict';

var Component = require('./Component');
var each = require('lodash/collection/each');
var without = require('lodash/array/without');

function Panel() {
  Component.apply(this, arguments);
  this._highlights = {};
}

Panel.Prototype = function() {

  this.getHighlights = function() {
    return this._highlights;
  };

  this.getDocument = function() {
    return this.context.doc;
  };

  // Set higlights on a document
  this.setHighlights = function(highlights) {
    var oldHighlights = this._highlights;
    var doc = this.getDocument();
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
    this.onHighlightsUpdated(highlights);
    // this.emit('highlights:updated', highlights);
  };

  this.onHighlightsUpdated = function(highlights) {
    /* jshint unused: false */
    console.warn('onHighlightsUpdated is not implemented');
  };

};

Component.extend(Panel);

module.exports = Panel;
