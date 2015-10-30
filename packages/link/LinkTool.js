'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var AnnotationTool = require('../../ui/AnnotationTool');
var _ = require('../../util/helpers');

var EditLinkPrompt = Component.extend({

  onSave: function(e) {
    e.preventDefault();
    this.props.tool.updateLink({
      url: this.refs.url.$el.val()
    });
  },

  // Tried setting .htmlProp('autofocus', true) in render
  // But this only worked for the first time
  didMount: function() {
    // var $el = this.refs.url.$el;
    // _.delay(function() {
    //   $el.focus();
    // }, 0);
  },

  onDelete: function(e) {
    e.preventDefault();
    this.props.tool.deleteLink();
  },

  render: function() {
    var link = this.props.link;
    var el = $$('div').addClass('se-prompt');

    el.append([
      $$('div').addClass('se-prompt-title').append(this.i18n.t('hyperlink')),
      $$('input').attr({type: 'text', placeholder: 'http://your-website.com', value: link.url})
                 .ref('url')
                 // This only works on the first load. Why?
                 // Is this element even preserved when unmounted and rerendered?
                 .htmlProp('autofocus', true)
                 .on('change', this.onSave),
      $$('a').attr({href: '#'})
             .addClass('se-delete-link')
             .append(this.i18n.t('delete'))
             .on('click', this.onDelete)
    ]);
    return el;
  }
});

/**
 * LinkTool
 *
 * Implements the SurfaceTool API.
 */

function LinkTool() {
  AnnotationTool.apply(this, arguments);

  var ctrl = this.getController();
  ctrl.connect(this, {
    'command:executed': this.onCommandExecuted
  });
}

LinkTool.Prototype = function() {

  this.static = {
    name: 'link',
    command: 'link'
  };

  this.dispose = function() {
    var ctrl = this.getController();
    ctrl.disconnect(this);
  };

  this.onCommandExecuted = function(info, commandName) {
    if (commandName === this.static.command) {
      // Toggle the edit prompt when either edit is requested or a new link has been created
      if (_.includes(['edit','create'], info.mode)) {
        this.togglePrompt();
      }
    }
  };

  this.togglePrompt = function() {
    var newState = _.extend({}, this.state, {showPrompt: !this.state.showPrompt});
    this.setState(newState);
  };

  this.updateLink = function(linkAttrs) {
    var link = this.getLink();
    // this.surface.transaction causes the prompt to close. If you don't want that
    // e.g. when re-enabling link title editing, switch to use doc.transaction.
    // QUESTION: Is it possible to use this.surface.transaction without causing the
    // prompt to close. -> Probably by changing the update implementation above
    // to preserve the showPrompt variable
    this.getSurface().transaction(function(tx) {
      tx.set([link.id, "url"], linkAttrs.url);
      tx.set([link.id, "title"], linkAttrs.title);
    });
  };

  this.deleteLink = function() {
    var link = this.getLink();

    this.getSurface().transaction(function(tx) {
      tx.delete(link.id);
    });
    this.togglePrompt();
  };

  this.getLink = function() {
    return this.getDocument().get(this.state.annotationId);
  };


  this.render = function() {
    var title = this.props.title || _.capitalize(this.getName());

    if (this.state.mode) {
      title = [_.capitalize(this.state.mode), title].join(' ');
    }

    var el = $$('div')
      .addClass('sc-link-tool se-tool')
      .attr('title', title);

    if (this.state.disabled) {
      el.addClass('sm-disabled');
    }

    if (this.state.mode === 'edit') {
      el.addClass('sm-active');
    }

    if (this.state.mode) {
      el.addClass(this.state.mode);
    }

    var button = $$("button").on('click', this.onClick);

    button.append(this.props.children);
    el.append(button);

    // When we are in edit mode showing the edit prompt
    if (this.state.mode === 'edit' && this.state.showPrompt) {
      var link = this.getLink();
      var prompt = $$(EditLinkPrompt, {link: link, tool: this});
      el.append(prompt);
    }
    return el;
  };
};

oo.inherit(LinkTool, AnnotationTool);

module.exports = LinkTool;
