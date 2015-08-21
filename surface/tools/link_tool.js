'use strict';

var _ = require('substance/helpers');
var AnnotationTool = require('../annotation_tool');
var LinkTool = AnnotationTool.extend({

  name: "link",

  getAnnotationData: function() {
    return {
      url: "",
      title: ""
    };
  },

  // Immediately switch to edit mode after link creation
  // and make it show the edit prompt.
  afterCreate: function(anno) {
    var state = this.getToolState();
    var newState = _.extend({}, state);
    newState.mode = 'edit';
    newState.showPrompt = true;
    this.setToolState(newState);
  },
  
  update: function(surface, sel) {
    this.surface = surface;
    if ( !surface.isEnabled() || sel.isNull() || sel.isContainerSelection() ) {
      return this.setDisabled();
    }
    var doc = this.getDocument();
    var annos = doc.getAnnotationsForSelection(sel, { type: 'link' });
    var oldState = this.getToolState();
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
    this.setToolState(newState);
  },

  updateLink: function(linkAttrs) {
    var doc = this.getDocument();
    var link = this.getLink();
    // this.surface.transaction causes the prompt to close. If you don't want that
    // e.g. when re-enabling link title editing, switch to use doc.transaction.
    // QUESTION: Is it possible to use this.surface.transaction without causing the
    // prompt to close. -> Probably by changing the update implementation above
    // to preserve the showPrompt variable
    this.surface.transaction(function(tx) {
      tx.set([link.id, "url"], linkAttrs.url);
      tx.set([link.id, "title"], linkAttrs.title);
    });
  },

  deleteLink: function() {
    var doc = this.getDocument();
    var link = this.getLink();
    this.surface.transaction(function(tx) {
      tx.delete(link.id);
    });
  },

  getLink: function() {
    return this.getDocument().get(this.state.linkId);
  },

  performAction: function() {
    var state = this.getToolState();
    var newState = _.extend({}, state);
    if (state.mode === "edit") {
      newState.showPrompt = !state.showPrompt;
      this.setToolState(newState);
    } else {
      AnnotationTool.prototype.performAction.call(this);
    }
  },

});

module.exports = LinkTool;
