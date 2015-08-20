'use strict';

var _ = require('substance/helpers');
var AnnotationTool = require('../annotation_tool');
var LinkTool = AnnotationTool.extend({

  name: "link",

  getAnnotationData: function() {
    return {
      url: "http://",
      title: ""
    };
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
      // newState.showPopup = true;
    } else {
      return this.setDisabled();
    }
    this.setToolState(newState);
  },

  updateLink: function(linkAttrs) {
    var doc = this.getDocument();
    var link = this.getLink();
    this.surface.transaction(function(tx) {
      tx.set([link.id, "url"], linkAttrs.url);
      tx.set([link.id, "title"], linkAttrs.title);
    });
  },

  getLink: function() {
    return this.getDocument().get(this.state.linkId);
  },

  performAction: function() {
    var state = this.getToolState();
    var newState = _.extend({}, state);
    if (state.mode === "edit") {
      // TODO: is this needed?
      // this.emit('edit', this);
      newState.showPrompt = true;
      this.setToolState(newState);
    } else {
      AnnotationTool.prototype.performAction.call(this);
    }
  },

});

module.exports = LinkTool;
