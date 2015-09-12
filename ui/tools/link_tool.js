'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var AnnotationTool = require('./annotation_tool');
var _ = require('../../basics/helpers');


var EditLinkPrompt = Component.extend({

  onSave: function(e) {
    e.preventDefault();
    this.props.tool.updateLink({
      url: this.refs.url.$el.val()
    });
  },

  onDelete: function(e) {
    e.preventDefault();
    this.props.tool.deleteLink();
  },

  render: function() {
    var link = this.props.link;
    var el = $$('div').addClass('prompt shadow border fill-white');

    el.append([
      $$('div').addClass('prompt-title').append('Hyperlink'),
      $$('input').attr({type: 'text', placeholder: 'http://your-website.com', value: link.url})
                 .key('url')
                 .on('change', this.onSave),
      $$('a').attr({href: '#'})
             .addClass('delete-link')
             .append('Delete')
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
}

LinkTool.Prototype = function() {

  this.getAnnotationData = function() {
    return {
      url: "",
      title: ""
    };
  };

  // Immediately switch to edit mode after link creation
  // and make it show the edit prompt.
  this.afterCreate = function(anno) {
    var state = this.getState();
    var newState = _.extend({}, state);
    newState.mode = 'edit';
    newState.showPrompt = true;
    newState.linkId = anno.id;
    this.setState(newState);
  };
  
  this.update = function(sel, surface) {
    // this.surface = surface;
    if ( !surface.isEnabled() || sel.isNull() || sel.isContainerSelection() ) {
      return this.setDisabled();
    }
    var doc = this.getDocument();
    var annos = doc.getAnnotationsForSelection(sel, { type: 'link' });

    var newState = {
      surface: surface,
      disabled: false,
      active: false,
      mode: null,
      sel: sel,
      annos: annos
    };
    if (this.canCreate(annos, sel)) {
      newState.mode = "create";
    } else if (this.canTruncate(annos, sel)) {
      newState.mode = "truncate";
      newState.active = true;
    } else if (this.canExpand(annos, sel)) {
      newState.mode = "expand";
    } else if (annos.length === 1) {
      newState.mode = "edit";
      newState.linkId = annos[0].id;      
      newState.active = true;
    } else {
      return this.setDisabled();
    }
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
  };

  this.getLink = function() {
    return this.getDocument().get(this.state.linkId);
  };

  this.performAction = function() {
    var state = this.getState();
    var newState = _.extend({}, state);
    if (state.mode === "edit") {
      newState.showPrompt = !state.showPrompt;
      this.setState(newState);
    } else {
      AnnotationTool.prototype.performAction.call(this);
    }
  };

  this.render = function() {
    var title = this.props.title;

    if (this.state.mode) {
      title = [_.capitalize(this.state.mode), title].join(' ');
    }

    var el = $$('div')
      .addClass('link tool');

    if (this.state.disabled) {
      el.addClass('disabled');
    }

    if (this.state.mode === 'edit') {
      el.addClass('active');
    }
    if (this.state.mode) {
      el.addClass(this.state.mode);
    }

    var button = $$("button")
      .addClass('button')
      .attr('title', title)
      .on('mousedown', this.onMouseDown)
      .on('click', this.onClick);

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


OO.inherit(LinkTool, AnnotationTool);

LinkTool.static.name = 'link';

module.exports = LinkTool;
