"use strict";

var Component = require('./Component');

var ICONS_FOR_TYPE = {
  "error": "fa-exclamation-circle",
  "info": "fa-info",
  "progress": "fa-exchange",
  "success": "fa-check-circle",
};

/*
  A simple StatusBar implementation that displays a document's title and
  renders messages.

  @class
  @component

  @prop {model/Document} doc The document instance

  @state {String} message The message displayed in the status bar.
*/

function StatusBar() {
  Component.apply(this, arguments);
}

StatusBar.Prototype = function() {

  this.didMount = function() {
    var logger = this.context.controller.getLogger();
    logger.on('messages:updated', this.handleStatusUpdate, this);
  };

  this.dispose = function() {
    var logger = this.context.controller.getLogger();
    logger.off(this);
  };

  this.render = function($$) {
    var meta = this.props.doc.getDocumentMeta();
    var title = meta ? meta.title : this.getLabel('untitled');
    var message = this.state.message;

    var el = $$('div').addClass("status-bar-component fill-light");
    el.append($$("div").addClass("document-status").append(title));

    if (message) {
      el.addClass(message.type);
      el.append(
        $$('div').addClass('notifications').append(
          $$("div").addClass("icon").append(
            $$('i').addClass('fa '+ICONS_FOR_TYPE[message.type])
          )
        ),
        $$('div').addClass('message').append(message.message)
      );
    }
    return el;
  };

  this.handleStatusUpdate = function(messages) {
    var currentMessage = messages.pop();
    this.setState({
      message: currentMessage
    });
  };
};

Component.extend(StatusBar);

module.exports = StatusBar;