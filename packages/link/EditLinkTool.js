'use strict';

import Tool from '../tools/Tool'
import clone from 'lodash/clone'

/**
  Tool to edit an existing link.

  Designed so that it can be used either in a toolbar, or within
  an overlay on the Surface.
*/
function EditLinkTool() {
  EditLinkTool.super.apply(this, arguments);
}

EditLinkTool.Prototype = function() {

  this.getUrlPath = function() {
    var propPath = this.constructor.urlPropertyPath;
    return [this.props.node.id].concat(propPath);
  };

  this._openLink = function() {
    console.log('open link...');
    var doc = this.context.documentSession.getDocument();
    window.open(doc.get(this.getUrlPath()), '_blank');
  };

  this.render = function($$) {
    var Prompt = this.getComponent('prompt');
    var Input = this.getComponent('input');
    var Button = this.getComponent('button');
    var node = this.props.node;
    var doc = node.getDocument();
    var el = $$('div').addClass('sc-edit-link-tool');
    var urlPath = this.getUrlPath();

    el.append(
      $$(Input, {
        type: 'url',
        path: urlPath,
        placeholder: 'Paste or type a link url'
      }),
      $$(Button, {
        icon: 'open-link',
        style: this.props.style
      }).on('click', this._openLink),

      $$(Button, {
        icon: 'delete',
        style: this.props.style
      })
        .attr('title', this.getLabel('delete'))
        .on('click', this.onDelete)
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

Tool.extend(EditLinkTool);

EditLinkTool.urlPropertyPath = ['url'];


export default EditLinkTool;
