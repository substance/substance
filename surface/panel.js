'use strict';

var Substance = require("../basics");

// Mixin with helpers to implement a scrollable panel
function Panel() {

}

Panel.Prototype = function() {

  // Get the current coordinates of the first element in the
  // set of matched elements, relative to the offset parent
  // Please be aware that it looks up until it finds a parent that has
  // position: relative|absolute set. So for now never set relative somewhere in your panel
  this.getPanelOffsetForElement = function(el) {
    var offsetTop = $(el).position().top;
    return offsetTop;
  };

  this.scrollToNode = function(nodeId) {
    // var n = this.findNodeView(nodeId);
    // TODO make this generic
    var panelContentEl = this.getScrollableContainer();

    // Node we want to scroll to
    var targetNode = $(panelContentEl).find("*[data-id="+nodeId+"]")[0];

    if (targetNode) {
      $(panelContentEl).scrollTop(this.getPanelOffsetForElement(targetNode));
    } else {
      console.warn(nodeId, 'not found in scrollable container');
    }
  };

};

Substance.initClass(Panel);
module.exports = Panel;


