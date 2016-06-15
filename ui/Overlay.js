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

  this.commandStates = this._getCommandStates();
}

Overlay.Prototype = function() {

  this.shouldRerender = function() {
    var commandStates = this._getCommandStates();
    if (commandStates !== this.commandStates) {
      this.commandStates = commandStates;
      return true;
    }
    return false;
  };

  this.render = function($$) {
    var el = $$('div').addClass('sc-overlay sm-hidden');
    var commandStates = this.context.commandManager.getCommandStates();
    var ComponentClass = this.props.overlay;
    el.append($$(ComponentClass, {
      commandStates: commandStates
    }).ref('overlayContent'));
    return el;
  };

  this.didMount = function() {
    // rerender the overlay content after anything else has been updated
    this.context.documentSession.on('didUpdate', this._onSessionDidUpdate, this);
  };

  this.dispose = function() {
    this.context.documentSession.off(this);
  };

  this.position = function(hints) {
    var content = this.refs.overlayContent;
    if (content.childNodes.length > 0) {
      // Position based on rendering hints
      this._position(hints);
      this.el.removeClass('sm-hidden');
    }
  };

  this._onSessionDidUpdate = function() {
    if (this.shouldRerender()) {
      this.rerender();
    }
  };

  this._getCommandStates = function() {
    return this.context.commandManager.getCommandStates();
  };

  this._position = function(hints) {
    if (hints) {
      var contentWidth = this.el.htmlProp('offsetWidth');
      var selectionMaxWidth = hints.rectangle.width;

      // By default, Overlays are aligned center/bottom to the selection
      this.el.css('top', hints.rectangle.top + hints.rectangle.height);
      var leftPos = hints.rectangle.left + selectionMaxWidth/2 - contentWidth/2;
      // Must not exceed left bound
      leftPos = Math.max(leftPos, 0);
      // Must not exceed right bound
      var maxLeftPos = hints.rectangle.left + selectionMaxWidth + hints.rectangle.right - contentWidth;
      leftPos = Math.min(leftPos, maxLeftPos);
      this.el.css('left', leftPos);
    }
  };
};

Component.extend(Overlay);
module.exports = Overlay;