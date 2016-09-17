
import Component from './Component'


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
  Link (represented as an icon)
*/
function Link() {
  Action.super.apply(this, arguments);
}

Link.Prototype = function() {

  this.render = function($$) {
    var iconEl = this.context.iconProvider.renderIcon($$, this.props.name);
    var el = $$('a')
      .attr({
        href: this.props.href,
        title: this.props.title,
        target: 'blank'
      })
      .addClass('se-action').append(
        iconEl,
        '\uFEFF' // Zero-width char so line-height property has an effect
      );
    return el;
  };
};

Component.extend(Link);


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
  Takes a path to a string property and makes it editable
*/
function Input() {
  Component.apply(this, arguments);
}

Input.Prototype = function() {
  this._onChange = function() {
    var documentSession = this.context.documentSession;
    var path = this.props.path;
    var newVal = this.el.val();

    documentSession.transaction(function(tx) {
      tx.set(path, newVal);
    });
  };

  this.render = function($$) {
    var documentSession = this.context.documentSession;
    var doc = documentSession.getDocument();
    var val = doc.get(this.props.path);

    var el = $$('input')
      .attr({
        value: val,
        type: this.props.type || 'text',
        placeholder: this.props.placeholder
      })
      .on('change', this._onChange)
      .addClass('se-input');

    return el;
  };
};

Component.extend(Input);

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
Prompt.Link = Link;
Prompt.Input = Input;
Prompt.Separator = Separator;

export default Prompt;
