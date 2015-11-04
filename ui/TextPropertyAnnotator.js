'use strict';

var oo = require('../util/oo');
var Surface = require('./Surface');
var TextPropertyManager = require('../model/TextPropertyManager');
var Component = require('./Component');
var TextProperty = require('./TextPropertyComponent');
var $$ = Component.$$;

/**
 * TextPropertyAnnotator
 *
 * @memberof module:ui
 * @extends module:ui/Surface
 */
function TextPropertyAnnotator() {
  Surface.apply(this, arguments);
  var doc = this.getDocument();
  this.textPropertyManager = new TextPropertyManager(doc);
}

TextPropertyAnnotator.Prototype = function() {

  this.dispose = function() {
    Surface.prototype.dispose.call(this);
  };

  this.isContainerEditor = function() {
    return false;
  };

  this.render = function() {
    var el = $$(this.props.tagName || 'div')
      .addClass("sc-text-property-annotator")
      .append(
        $$(TextProperty, {
          tagName: "div",
          path: this.props.path
        })
      );
    return el;
  };
};

oo.inherit(TextPropertyAnnotator, Surface);
module.exports = TextPropertyAnnotator;