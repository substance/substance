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

  this.getUrlPath = function() {
    var propPath = this.constructor.static.urlPropertyPath;
    return [this.props.node.id].concat(propPath);
  };

  this.render = function($$) {
    var node = this.props.node;
    var doc = node.getDocument();
    var el = $$('div').addClass('sc-edit-link-tool');
    var urlPath = this.getUrlPath();

    el.append(
      $$(Prompt).append(
        $$(Prompt.Input, {
          type: 'url',
          path: urlPath,
          placeholder: 'Paste or type a link url'
        }),
        $$(Prompt.Separator),
        $$(Prompt.Link, {
          name: 'open-link',
          href: doc.get(urlPath),
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
    var sm = this.context.surfaceManager;
    var surface = sm.getFocusedSurface();
    surface.transaction(function(tx, args) {
      tx.delete(node.id);
      return args;
    });
  };
};

Component.extend(EditLinkTool);

EditLinkTool.static.urlPropertyPath = ['url'];
EditLinkTool.static.name = 'edit-link';

EditLinkTool.static.getProps = function(commandStates) {
  if (commandStates.link.mode === 'edit') {
    return clone(commandStates.link);
  } else {
    return undefined;
  }
};

module.exports = EditLinkTool;