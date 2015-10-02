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

  // var ctrl = this.context.controller;
  // var logger = ctrl.getLogger();
  
  // logger.connect(this, {
  //   'messages:updated': this.handleStatusUpdate
  // });
}

StatusBar.Prototype = function() {

  this.render = function() {
    var meta = this.props.doc.getDocumentMeta();
    var title = meta ? meta.title : 'Untitled';
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

OO.inherit(StatusBar, Component);

module.exports = StatusBar;
