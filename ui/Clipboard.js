"use strict";

var oo = require('../util/oo');
var uuid = require('../util/uuid');
var DOMElement = require('./DefaultDOMElement');
var DefaultDOMElement = require('./DefaultDOMElement');
var JSONConverter = require('../model/JSONConverter');

/**
  The Clipboard is a Component which should be rendered as a sibling component
  of one or multiple Surfaces.

  It uses the JSONImporter and JSONExporter for internal copy'n'pasting,
  i.e., within one window or between two instances with the same DocumentSchema.

  For inter-application copy'n'paste, the ClipboardImporter and ClipboardExporter is used.
  For HTML coming from the clipboard we support a fixed set of content types:

    - Paragraph
    - Heading
    - Strong/Bold
    - Emphasis/Italic
    - Link
    - Table
    - List

  To make this work for a custom schema, you must include the default nodes into your schema.
  Otherwise, only plain text will be copied. If `Paragraph` is not present in your schema,
  `schema.getDefaultTextType()` is used instead.
*/
var Clipboard = function(surface, htmlImporter, htmlExporter) {

  this.surface = surface;
  this.htmlImporter = htmlImporter;
  this.htmlExporter = htmlExporter;

  this.onCopy = this.onCopy.bind(this);
  this.onCut = this.onCut.bind(this);

  this.isIe = (window.navigator.userAgent.toLowerCase().indexOf("msie") != -1 || window.navigator.userAgent.toLowerCase().indexOf("trident") != -1);
  this.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  if (this.isIe) {
    this.onBeforePasteShim = this.onBeforePasteShim.bind(this);
    this.onPasteShim = this.onPasteShim.bind(this);
  } else {
    this.onPaste = this.onPaste.bind(this);
  }
};

Clipboard.Prototype = function() {

  this.getSurface = function() {
    return this.surface;
  };

  /*
    Called by to enable clipboard handling on a given root element.

    @private
    @param {util/jquery} a jQuery wrapped element
  */
  this.attach = function(rootElement) {
    // TODO: we want to use ui/DOMElement instead of $
    // However, we need to inject an element into document.body, which can't be accessed via
    // DOMElement API atm.

    // Note: we need a hidden content-editable element to be able to intercept native pasting.
    // We put this element into document.body and share it among all Clipboard instances.
    // This element must be content-editable, thus it must not have `display:none` or `visibility:hidden`,
    // To hide it from the view we use a zero width and position it outside of the screen.
    if (!Clipboard._sharedPasteElement) {
      var root = rootElement.getRoot();
      var body = root.find('body');
      if (body) {
        var _sharedPasteElement = root.createElement('div')
          .attr('contenteditable', true)
          .css({
            position: 'fixed',
            opacity: '0.0',
            bottom: '-1000px',
            width: '0px'
          });
        Clipboard._sharedPasteElement = _sharedPasteElement;
        body.append(_sharedPasteElement);
      }
    }
    this.el = Clipboard._sharedPasteElement;

    rootElement.on('copy', this.onCopy);
    rootElement.on('cut', this.onCut);

    if (this.isIe) {
      rootElement.on('beforepaste', this.onBeforePasteShim);
      rootElement.on('paste', this.onPasteShim);
    } else {
      rootElement.on('paste', this.onPaste);
    }
  };

  this.detach = function(rootElement) {
    rootElement.off('copy', this.onCopy);
    rootElement.off('cut', this.onCut);
    if (this.isIe) {
      rootElement.off('beforepaste', this.onBeforePasteShim);
      rootElement.off('paste', this.onPasteShim);
    } else {
      rootElement.off('paste', this.onPaste);
    }
  };

  this.onCopy = function(event) {
    // console.log("Clipboard.onCopy", arguments);
    var clipboardData = this._copy();
    // in the case that browser doesn't provide event.clipboardData
    // we keep the copied data for internal use.
    // Then we have copy'n'paste at least within one app
    Clipboard.clipboardData = clipboardData;
    if (event.clipboardData && clipboardData.doc) {
      event.preventDefault();
      // convert the copied document to json
      var converter = new JSONConverter();
      var json = converter.exportDocument(this.clipboardDoc);
      json.__id__ = clipboardData.doc.__id__;
      // store as json, plain text, and html
      event.clipboardData.setData('application/substance', JSON.stringify(json));
      event.clipboardData.setData('text/plain', clipboardData.text);
      event.clipboardData.setData('text/html', clipboardData.html);
    }
  };

  this.onCut = function(event) {
    // preventing default behavior to avoid that contenteditable
    // destroys our DOM
    event.preventDefault();
    // console.log("Clipboard.onCut", arguments);
    this.onCopy(event);
    var surface = this.getSurface();
    if (!surface) return;
    surface.transaction(function(tx, args) {
      return surface.delete(tx, args);
    });
  };

  // Works on Safari/Chrome/FF
  this.onPaste = function(e) {
    var clipboardData = e.clipboardData;
    var surface = this.getSurface();

    // FIXME: it seems, that in order to share the clipboard among
    // surfaces we attach it to a higher level element.
    // But why not just have one clipboard for each?
    // Even if it seems inconvenient to use the native clipboard as shared
    // data store, it would be more consistent regarding the responsibility
    // of the clipboard. However, then we need reliable native clipboard support.
    if (!surface || !surface.isNativeFocused) return;

    var types = {};
    for (var i = 0; i < clipboardData.types.length; i++) {
      types[clipboardData.types[i]] = true;
    }

    // HACK: FF does not provide HTML coming in from other applications
    // so fall back to the paste shim
    if (this.isFF && !types['application/substance'] && !types['text/html']) {
      this.onBeforePasteShim();
      surface.rerenderSelection();
      this.onPasteShim();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    // console.log('Available types', types);

    var json;
    var docEl;
    var html;
    var plainText = clipboardData.getData('text/plain');

    // use internal data if available
    if (types['application/substance']) {
      json = clipboardData.getData('application/substance');
      return this._pasteSubstanceData(json, plainText);
    }

    // if we have content given as HTML we let the importer assess the quality first
    // and fallback to plain text import if it's bad
    if (types['text/html']) {
      html = clipboardData.getData('text/html');
      docEl = DefaultDOMElement.parseHTML(html);
      // check the quality of the HTML first and
      // fall back to plain-text pasting if it is not
      // compatible.
      if (this.htmlImporter.checkQuality(docEl)) {
        return this._pasteHtml(docEl, plainText);
      }
    }
    // Fallback to plain-text in other cases
    if (surface.isContainerEditor()) {
      var doc = surface.getDocument();
      var defaultTextType = doc.getSchema().getDefaultTextType();
      surface.transaction(function(tx, args) {
        // TODO: this implementation should not do this
        // instead the 'paste' transformation should be able to do it.
        var paraText = plainText.split(/\s*\n\s*\n/);
        var pasteDoc = doc.newInstance();
        var container = pasteDoc.create({
          type: 'container',
          id: 'clipboard_content',
          nodes: []
        });
        for (var i = 0; i < paraText.length; i++) {
          var paragraph = pasteDoc.create({
            id: uuid(defaultTextType),
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

  this._copy = function() {
    var wSel = window.getSelection();
    var surface = this.getSurface();
    var sel = surface.getSelection();
    var doc = surface.getDocument();
    var clipboardDoc = null;
    var clipboardText = "";
    var clipboardHtml = "";
    if (wSel.rangeCount > 0 && !sel.isCollapsed()) {
      var wRange = wSel.getRangeAt(0);
      this.clipboardText = wRange.toString();
      this.clipboardDoc = surface.copy(doc, sel);
      // console.log("Clipboard._copy(): created a copy", this.clipboardDoc);
    }
    return {
      doc: clipboardDoc,
      html: clipboardHtml,
      text: clipboardText
    };
  };

  this.onBeforePasteShim = function() {
    var surface = this.getSurface();
    if (!surface) return;
    // console.log("Paste before...");
    this.el.focus();
    var range = document.createRange();
    range.selectNodeContents(this.el);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  this.onPasteShim = function() {
    this.el.empty();
    var sel = this.surface.getSelection();
    window.setTimeout(function() {
      this.surface.selection = sel;
      var html = this.el.html();
      this.el.empty();
      html = ['<html><head></head><body>', html, '</body></html>'].join('');
      var docEl = DOMElement.parseHTML(html);
      return this._pasteHtml(docEl);
    }.bind(this));
  };

  this._pasteSubstanceData = function(json, text) {
    var surface = this.getSurface();
    if (!surface) return;
    var doc = surface.getDocument();

    var content = doc.newInstance();
    var converter = new JSONConverter();
    converter.importDocument(content, JSON.parse(json));

    surface.transaction(function(tx, args) {
      args.text = text;
      args.doc = content;
      return surface.paste(tx, args);
    });
  };

  /*
    Pastes a given parsed html document into the surface.

    @param {ui/DOMElement} docElement
    @param {String} text plain text representation used as a fallback
  */
  this._pasteHtml = function(docElement, text) {
    var surface = this.getSurface();
    if (!surface) return;
    // TODO: the clipboard importer should make sure
    // that the container exists
    var content = this.htmlImporter.importDocument(docElement);
    surface.transaction(function(tx, args) {
      args.text = text;
      args.doc = content;
      return surface.paste(tx, args);
    });
  };

};

oo.initClass(Clipboard);

/*
  A shim for browsers with an unsupported native clipboard.
*/
Clipboard.clipboardData = {
  doc: null,
  html: "",
  text: ""
};


module.exports = Clipboard;
