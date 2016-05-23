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
    var el = $$('div').addClass('sc-overlay sm-hidden');
    var commandStates = this.context.commandManager.getCommandStates();
    var ComponentClass = this.props.overlay;
    el.append($$(ComponentClass, {
      commandStates: commandStates
    }).ref('overlayContent'));
    return el;
  };

  this.didMount = function() {
    this.context.documentSession.on('didUpdate', this.rerender, this);
    this._update();
  };

  this.dispose = function() {
    this.context.documentSession.off(this);
  };

  this.didUpdate = function() {
    this._update();
  };

  // Position + show/hide
  this._update = function() {
    var content = this.refs.overlayContent;

    if (content.childNodes.length > 0) {
      // Position based on rendering hints
      this._position();
      this.el.removeClass('sm-hidden');
    }
  };

  this._position = function() {
    var hints = this.props.hints;
    var overlayContent = this.refs.overlayContent;
    window.overlayContent = overlayContent;

    if (hints) {
      var contentWidth = this.el.htmlProp('offsetWidth');
      var contentHeight = this.el.htmlProp('offsetHeight');
      var selectionMaxWidth = hints.rectangle.width;
      var selectionHeight = hints.rectangle.height;

      // By default, Overlays are aligned center/top to the selection
      this.el.css('top', hints.rectangle.top - contentHeight);
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