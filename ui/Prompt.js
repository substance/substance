'use strict';

var Component = require('./Component');

function Prompt() {
  Prompt.super.apply(this, arguments);
}

Prompt.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-prompt');
    el.append($$('div').addClass('se-arrow'));
    el.append(
      $$('div').addClass('se-content').append(
        this.props.children
      )
    );
    return el;
  };
};

Component.extend(Prompt);

/*
  Action (represented as an icon)
*/
function Action() {
  Action.super.apply(this, arguments);
}

Action.Prototype = function() {

  this.render = function($$) {
    var iconEl = this.context.iconProvider.renderIcon($$, this.props.name);
    var el = $$('button')
      .attr({title: this.props.title})
      .addClass('se-action').append(
        iconEl
      );
    return el;
  };
};

Component.extend(Action);

/*
  Label for the prompt (not interactive)
*/
function Label() {
  Label.super.apply(this, arguments);
}

Label.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('se-label').append(this.props.label);
    return el;
  };
};

Component.extend(Label);

/*
  Divider can be used to sepate prompt items
*/
function Separator() {
  Label.super.apply(this, arguments);
}

Separator.Prototype = function() {
  this.render = function($$) {
    return $$('div').addClass('se-separator');
  };
};

Component.extend(Separator);

Prompt.Action = Action;
Prompt.Label = Label;
Prompt.Separator = Separator;

module.exports = Prompt;
