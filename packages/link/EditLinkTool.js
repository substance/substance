'use strict';

var Component = require('../../ui/Component');
var Icon = require('../../ui/FontAwesomeIcon');
var clone = require('lodash/clone');
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
      $$('input')
        .attr({
          type: 'text',
          placeholder: 'http://example.com',
          value: node.url
        })
        .ref('url')
        // This only works on the first load. Why?
        // Is this element even preserved when unmounted and rerendered?
        .htmlProp('autofocus', true)
        .on('change', this.onSave),
      $$('div').addClass('se-actions').append(
        // $$('button')
        //   .attr({title: this.i18n.t('save')})
        //   .addClass('se-action').append(
        //     $$(Icon, {icon: 'fa-check'})
        //   )
        //   .on('click', this.onSave),
        $$('a')
          .attr({
            title: this.i18n.t('open-link'),
            href: node.url,
            target: '_blank'
          })
          .addClass('se-action').append(
            $$(Icon, {icon: 'fa-external-link'})
          ),
        $$('button')
          .attr({title: this.i18n.t('delete')})
          .addClass('se-action').append(
            $$(Icon, {icon: 'fa-trash-o'})
          )
          .on('click', this.onDelete)
      )
    );
    return el;
  };

  this.getSurface = function() {
    return this.context.controller.getFocusedSurface();
  };

  this.onSave = function(e) {
    e.preventDefault();

    var node = this.props.node;
    var surface = this.getSurface();
    var url = this.refs.url.val();

    surface.transaction(function(tx) {
      tx.set([node.id, "url"], url);
    }.bind(this));
  };

  this.onDelete = function(e) {
    e.preventDefault();
    var node = this.props.node;
    var surface = this.getSurface();
    surface.transaction(function(tx) {
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