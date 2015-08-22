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

});

module.exports = ListComponent;
