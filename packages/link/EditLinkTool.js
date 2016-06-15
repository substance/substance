'use strict';

var Component = require('../../ui/Component');
var clone = require('lodash/clone');
var Prompt = require('../../ui/Prompt');

/**
  Component to edit an existing link.

  Designed so that it can be used either in a toolbar, or within
  an overlay on the Surface.
*/
function EditLinkTool() {
  EditLinkTool.super.apply(this, arguments);
}

EditLinkTool.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var el = $$('div').addClass('sc-edit-link-tool');

    el.append(
      $$(Prompt).append(
        $$(Prompt.Input, {
          type: 'url',
          path: [node.id, 'url'],
          placeholder: 'Paste or type a link url'
        }),
        $$(Prompt.Separator),
        $$(Prompt.Link, {
          name: 'open-link',
          href: node.url,
          title: this.getLabel('open-link')
        }),
        $$(Prompt.Action, {name: 'delete', title: this.getLabel('delete')})
          .on('click', this.onDelete)
      )
    );
    return el;
  };

  this.onDelete = function(e) {
    e.preventDefault();
    var node = this.props.node;
    var documentSession = this.context.documentSession;
    documentSession.transaction(function(tx) {
      tx.delete(node.id);
    });
  };
};

Component.extend(EditLinkTool);

EditLinkTool.static.getProps = function(commandStates) {
  if (commandStates.link.mode === 'edit') {
    return clone(commandStates.link);
  } else {
    return undefined;
  }
};

EditLinkTool.static.name = 'edit-link';

module.exports = EditLinkTool;