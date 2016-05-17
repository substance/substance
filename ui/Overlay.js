'use strict';

var Component = require('./Component');

/**
  Overlay component

  Used internally by surface to place overlay relative to selection/cursor

  @class
  @component
*/
function Overlay() {
  Component.apply(this, arguments);
}

Overlay.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-overlay');
    return el;
  };
};

Component.extend(Overlay);
module.exports = Overlay;