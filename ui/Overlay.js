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
  this.didMount = function() {
    this.context.documentSession.on('didUpdate', this.rerender, this);
  };

  this.dispose = function() {
    this.context.documentSession.off(this);
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
    this._update();
  };

  this.didUpdate = function() {
    this._update();
  };

  // Position + show/hide
  this._update = function() {
    var content = this.refs.overlayContent;

    if (content.children.length > 0) {
      // Position based on rendering hints
      this._position();
      this.el.removeClass('sm-hidden');
    }
  };

  this._position = function() {
    var hints = this.props.hints;
    if (hints) {
        // TODO: do smarter layouting
        var toolContainerWidth,
            toolContainerHeight = 0,
            toolContainerEl = this.refs.seTools.$el;
        if(this.refs.seTools.$el.width()) {
            toolContainerWidth = toolContainerEl.width()/2;
            toolContainerHeight = toolContainerEl.height();
        }
        var selectionWidth = hints.rectangle.right-hints.rectangle.left;

        this.$el.css('top', hints.rectangle.top - toolContainerHeight-10);
        this.$el.css('left', (hints.rectangle.left-toolContainerWidth)+(selectionWidth/2));
    }
  };
};

Component.extend(Overlay);
module.exports = Overlay;