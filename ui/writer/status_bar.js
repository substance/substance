"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

var ICONS_FOR_TYPE = {
  "error": "fa-exclamation-circle",
  "info": "fa-info",
  "progress": "fa-exchange",
  "success": "fa-check-circle",
};

// The Status Bar
// ----------------

function StatusBar() {
  Component.apply(this, arguments);
  this.handleNotificationUpdate = this.handleNotificationUpdate.bind(this);
}

StatusBar.Prototype = function() {

  this.render = function() {
    var meta = this.props.doc.getDocumentMeta();
    var title = meta ? meta.title : 'Untitled';

    var el = $$('div').addClass("status-bar-component fill-light");
    var statusEl = $$("div").addClass("document-status").append(title);
    var message = this.state.message;
    if (message) {
      el.addClass(message.type);
      statusEl.append(
        $$('div').addClass('notifications').append(
          $$("div").addClass("icon").append(
            $$('i').addClass('fa '+ICONS_FOR_TYPE[message.type])
          )
        )
      );
      statusEl.append(
        $$('div').addClass('message').append(message.message)
      );
    }
    el.append(statusEl);
    return el;
  };

  this.didMount = function() {
    var notifications = this.context.notifications;
    notifications.connect(this, {
      'messages:updated': this.handleNotificationUpdate
    });
  };

  this.handleNotificationUpdate = function(messages) {
    var currentMessage = messages.pop();
    this.setState({
      message: currentMessage
    });
  };

};

OO.inherit(StatusBar, Component);

module.exports = StatusBar;
