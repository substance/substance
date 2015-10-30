"use strict";

var $ = require('../util/jquery');
var _ = require('../util/helpers');
var oo = require('../util/oo');

/**
 * Surface Clipboard is owned by a module:ui/FormEditor.
 *
 *
 * @class
 * @memberof module:ui
 */

var Clipboard = function(controller, htmlImporter, htmlExporter) {

  this.controller = controller;
  this.htmlImporter = htmlImporter;
  this.htmlExporter = htmlExporter;

  this._contentDoc = null;
  this._contentText = "";

  this._onKeyDown = _.bind(this.onKeyDown, this);
  this._onCopy = _.bind(this.onCopy, this);
  this._onCut = _.bind(this.onCut, this);

  this.isIe = (window.navigator.userAgent.toLowerCase().indexOf("msie") != -1 || window.navigator.userAgent.toLowerCase().indexOf("trident") != -1);
  this.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  if (this.isIe) {
    this._beforePasteShim = _.bind(this.beforePasteShim, this);
    this._pasteShim = _.bind(this.pasteShim, this);
  } else {
    this._onPaste = _.bind(this.onPaste, this);
  }
};

Clipboard.Prototype = function() {

  this.getSurface = function() {
    return this.controller.getFocusedSurface();
  };

  this.attach = function(rootElement) {
    this.el = window.document.createElement('div');
    this.$el = $(this.el);
    this.$el.prop('contenteditable', 'true').addClass('se-clipboard');
    rootElement.appendChild(this.el);

    rootElement.addEventListener('keydown', this._onKeyDown, false);
    rootElement.addEventListener('copy', this._onCopy, false);
    rootElement.addEventListener('cut', this._onCut, false);

    if (this.isIe) {
      rootElement.addEventListener('beforepaste', this._beforePasteShim, false);
      rootElement.addEventListener('paste', this._pasteShim, false);
    } else {
      rootElement.addEventListener('paste', this._onPaste, false);
    }
  };

  this.detach = function(rootElement) {
    this.$el.remove();

    rootElement.removeEventListener('keydown', this._onKeyDown, false);
    rootElement.removeEventListener('copy', this._onCopy, false);
    rootElement.removeEventListener('cut', this._onCut, false);
    if (this.isIe) {
      rootElement.removeEventListener('beforepaste', this._beforePasteShim, false);
      rootElement.removeEventListener('paste', this._pasteShim, false);
    } else {
      rootElement.removeEventListener('paste', this._onPaste, false);
    }
  };

  this.onCopy = function(event) {
    // console.log("Clipboard.onCopy", arguments);
    this._copySelection();
    if (event.clipboardData && this._contentDoc) {
      var html = this.htmlExporter.convert(this._contentDoc);
      // console.log('Stored HTML in clipboard', html);
      this._contentDoc.__id__ = _.uuid();
      var data = this._contentDoc.toJSON();
      data.__id__ = this._contentDoc.__id__;
      event.clipboardData.setData('application/substance', JSON.stringify(data));
      event.clipboardData.setData('text/plain', $(html).text());
      event.clipboardData.setData('text/html', html);
      event.preventDefault();
    }
  };

  // nothing special for cut.
  this.onCut = function(e) {
    e.preventDefault();
    // console.log("Clipboard.onCut", arguments);
    this.onCopy(e);
    var surface = this.getSurface();
    if (!surface) return;
    surface.transaction(function(tx, args) {
      return surface.delete(tx, args);
    });
  };

  this.pasteSubstanceData = function(data) {
    var surface = this.getSurface();
    if (!surface) return;
    var doc = surface.getDocument();
    // try {
      var content = doc.newInstance();
      content._setForClipboard(true);
      content.loadSeed(JSON.parse(data));
      var plainText = "";
      var pasteContent = content.get('clipboard_content');
      // TODO: try to get rid of that here.
      // we need a document.toPlainText() for that
      if (pasteContent.length > 0) {
        var firstPath = pasteContent.getFirstPath();
        var lastPath = pasteContent.getLastPath();
        var lastLength = content.get(lastPath).length;
        var sel = doc.createSelection({
          type: 'container',
          containerId: 'clipboard_content',
          startPath: firstPath,
          startOffset: 0,
          endPath: lastPath,
          endOffset: lastLength
        });
        plainText = content.getTextForSelection(sel);
      }
      surface.transaction(function(tx, args) {
        args.text = plainText;
        args.doc = content;
        return surface.paste(tx, args);
      });
    // } catch (error) {
    //   console.error(error);
    //   logger.error(error);
    // }
  };

  this.pasteHtml = function(htmlDoc) {
    var surface = this.getSurface();
    if (!surface) return;
    var logger = surface.getLogger();
    var doc = surface.getDocument();
    try {
      var content = doc.newInstance();
      content._setForClipboard(true);
      // TODO: the clipboard importer should make sure
      // that the container exists
      if (!content.get('clipboard_content')) {
        content.create({
          id: 'clipboard_content',
          type: 'container',
          nodes: []
        });
      }
      this.htmlImporter.convert($(htmlDoc), content);
      surface.transaction(function(tx, args) {
        args.text = htmlDoc.body.textContent;
        args.doc = content;
        return surface.paste(tx, args);
      });
    } catch (error) {
      console.error(error);
      logger.error(error);
    }
  };

  // Works on Safari/Chrome/FF
  this.onPaste = function(e) {
    var clipboardData = e.clipboardData;
    var surface = this.getSurface();

    if (!surface || !surface.isNativeFocused) return;
    var types = {};
    for (var i = 0; i < clipboardData.types.length; i++) {
      types[clipboardData.types[i]] = true;
    }

    // HACK: FF does not provide HTML coming in from other applications
    // so fall back to the paste shim
    if (this.isFF && !types['application/substance'] && !types['text/html']) {
      this.beforePasteShim();
      surface.rerenderSelection();
      this.pasteShim();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    // console.log('Available types', types);

    // use internal data if available
    if (types['application/substance']) {
      return this.pasteSubstanceData(clipboardData.getData('application/substance'));
    }

    // if we have content given as HTML we let the importer assess the quality first
    // and fallback to plain text import if it's bad
    if (types['text/html']) {
      var html = clipboardData.getData('text/html');
      var htmlDoc = new window.DOMParser().parseFromString(html, "text/html");
      if (this.htmlImporter.checkQuality($(htmlDoc))) {
        return this.pasteHtml(htmlDoc);
      }
    }
    // Fallback to plain-text in other cases
    var plainText = clipboardData.getData('text/plain');
    
    if (surface.isContainerEditor()) {
      var doc = surface.getDocument();
      var defaultTextType = doc.getSchema().getDefaultTextType();
      surface.transaction(function(tx, args) {
        // TODO: this implementation should not do this
        // instead the 'paste' transformation should be able to do it.
        var paraText = plainText.split(/\s*\n\s*\n/);
        var pasteDoc = doc.newInstance();
        pasteDoc._setForClipboard(true);
        var container = pasteDoc.create({
          type: 'container',
          id: 'clipboard_content',
          nodes: []
        });
        for (var i = 0; i < paraText.length; i++) {
          var paragraph = pasteDoc.create({
            id: _.uuid(defaultTextType),
            type: defaultTextType,
            content: paraText[i]
          });
          container.show(paragraph.id);
        }
        args.doc = pasteDoc;
        return surface.paste(tx, args);
      });
    } else {
      surface.transaction(function(tx, args) {
        args.text = plainText.split('').join('');
        return surface.insertText(tx, args);
      });
    }
  };

  this.beforePasteShim = function() {
    var surface = this.getSurface();
    if (!surface) return;
    // console.log("Paste before...");
    this.$el.focus();
    var range = document.createRange();
    range.selectNodeContents(this.el);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  this.pasteShim = function() {
    this.$el.empty();
    var self = this;
    var surface = this.getSurface();
    if (!surface) return;
    var sel = surface.getSelection();
    setTimeout(function() {
      surface.selection = sel;
      var html = self.$el.html();
      html = ['<html><head></head><body>', html, '</body></html>'].join('');
      self.$el.empty();
      var htmlDoc = new window.DOMParser().parseFromString(html, "text/html");
      // if (self.htmlImporter.checkQuality($(htmlDoc))) {
        return self.pasteHtml(htmlDoc);
      // }
    }, 0);
  };

  this.onKeyDown = function(e) {
    if (e.keyCode === 88 && (e.metaKey||e.ctrlKey)) {
      // console.log('Handle cut');
      // this.handleCut();
      // e.preventDefault();
      // e.stopPropagation();
    }
    else if (e.keyCode === 86 && (e.metaKey||e.ctrlKey)) {
      // console.log('Handle paste');
      this.handlePaste();
      // e.preventDefault();
      // e.stopPropagation();
    }
    else if (e.keyCode === 67 && (e.metaKey||e.ctrlKey)) {
      // console.log('Handle copy');
      // this.handleCopy(e);
      // e.preventDefault();
      // e.stopPropagation();
    }
  };

  this.handleCut = function() {
    // console.log("Cutting into Clipboard...");
    var wSel = window.getSelection();
    // TODO: deal with multiple ranges
    // first extract the selected content into the hidden element
    var wRange = wSel.getRangeAt(0);
    var frag = wRange.cloneContents();
    this.el.innerHTML = "";
    this.el.appendChild(frag);
    this._copySelection();
    var surface = this.getSurface();
    if (!surface) return;
    try {
      // console.log("...selection before deletion", surface.getSelection().toString());
      surface.delete();
    } catch (error) {
      console.error(error);
      this.logger.error(error);
      return;
    }
    // select the copied content
    var wRangeNew = window.document.createRange();
    wRangeNew.selectNodeContents(this.el);
    wSel.removeAllRanges();
    wSel.addRange(wRangeNew);

    // hacky way to reset the selection which gets lost otherwise
    window.setTimeout(function() {
      // console.log("...restoring the selection");
      surface.rerenderDomSelection();
    }, 10);
  };

  this.handlePaste = function() {
  };

  this.handleCopy = function() {
    // Nothing here
  };

  this._copySelection = function() {
    var wSel = window.getSelection();
    this._contentText = "";
    this._contentDoc = null;
    var surface = this.getSurface();
    var sel = surface.getSelection();
    var doc = surface.getDocument();
    if (wSel.rangeCount > 0 && !sel.isCollapsed()) {
      var wRange = wSel.getRangeAt(0);
      this._contentText = wRange.toString();
      this._contentDoc = surface.copy(doc, sel);
      // console.log("Clipboard._copySelection(): created a copy", this._contentDoc);
    } else {
      this._contentDoc = null;
      this._contentText = "";
    }
  };
};

oo.initClass(Clipboard);

module.exports = Clipboard;
