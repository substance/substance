'use strict';

// var _ = require('../../basics/helpers');
var Component = require('../component');
var $$ = Component.$$;
var TextProperty = require('../text_property_component');
var List = require('../../document/nodes/list');

var ListComponent = Component.extend({

  render: function() {
    var doc = this.props.doc;
    return List.static.render(this.props.node, {
      createElement: function(tagName) {
        return $$(tagName);
      },
      createAnnotatedTextNode: function(path) {
        return $$(TextProperty, { doc: doc, path: path });
      }
    });
  },

  didMount: function() {
    if (this.doc) {
      this._dispose();
    }
    this.doc = this.props.doc;
    this.doc.getEventProxy('path').add([this.props.node.id, 'items'], this, this.onItemsChanged);
  },

  willUnmount: function() {
    this._dispose();
  },

  _dispose: function() {
    this.doc.getEventProxy('path').remove([this.props.node.id, 'items'], this);
    this.doc = null;
  },

  onItemsChanged: function() {
    console.log('YAY');
    this.rerender();
  },

});

module.exports = ListComponent;
