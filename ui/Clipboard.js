"use strict";

var oo = require('../util/oo');
var documentHelpers = require('../model/documentHelpers');
var ClipboardImporter = require('./ClipboardImporter');
var ClipboardExporter = require('./ClipboardExporter');
var substanceGlobals = require('../util/substanceGlobals');
var platform = require('../util/platform');

/**
  The Clipboard is a Component which should be rendered as a sibling component
  of one or multiple Surfaces.

  It uses the JSONImporter and JSONExporter for internal copy'n'pasting,
  i.e., within one window or between two instances with the same DocumentSchema.

  For inter-application copy'n'paste, the ClipboardImporter and ClipboardExporter is used.

  @class Clipboard
*/
function Clipboard(surface, config) {

  this.surface = surface;
  var doc = surface.getDocument();
  var schema = doc.getSchema();

  var htmlConverters = [];
  if (config.converterRegistry) {
    htmlConverters = config.converterRegistry.get('html') || [];
  }
  var _config = {
    schema: schema,
    DocumentClass: doc.constructor,
    converters: htmlConverters
  };

  this.htmlImporter = new ClipboardImporter(_config);
  this.htmlExporter = new ClipboardExporter(_config);

  this.onCopy = this.onCopy.bind(this);
  this.onCut = this.onCut.bind(this);

  if (platform.isIE) {
    this.onBeforePasteShim = this.onBeforePasteShim.bind(this);
    this.onPasteShim = this.onPasteShim.bind(this);
  } else {
    this.onPaste = this.onPaste.bind(this);
  }
}

Clipboard.Prototype = function() {

  this.getSurface = function() {
    return this.surface;
  };

  /*
    Called by to enable clipboard handling on a given root element.

    @private
    @param {util/jquery} a jQuery wrapped element
  */
  this.attach = function(el) {
    // WORKAROUND: Edge is not permitting access the clipboard during onCopy
    if (!platform.isEdge) {
      el.addEventListener('copy', this.onCopy, { context: this });
    }
    el.addEventListener('cut', this.onCut, { context: this });
    if (this.isIe) {
      el.addEventListener('beforepaste', this.onBeforePasteShim, { context: this });
      el.addEventListener('paste', this.onPasteShim, { context: this });
    } else {
      el.addEventListener('paste', this.onPaste, { context: this });
    }
  };

  this.didMount = function() {
    var el = this.surface;
    // Note: we need a hidden content-editable element to be able to intercept native pasting.
    // We put this element into document.body and share it among all Clipboard instances.
    // This element must be content-editable, thus it must not have `display:none` or `visibility:hidden`,
    // To hide it from the view we use a zero width and position it outside of the screen.
    if (!Clipboard._sharedPasteElement) {
      var root = el.getRoot();
      var body = root.find('body');
      if (body) {
        var _sharedPasteElement = body.createElement('div')
          .attr('contenteditable', true)
          .attr('tabindex', -1)
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
  };

  /*
    Called by to disable clipboard handling.
  */
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

  /*
    Called when copy event fired.

    @param {Event} event
  */
  this.onCopy = function(event) {
    // console.log("Clipboard.onCopy", arguments);
    var clipboardData = this._copy();
    // in the case that browser doesn't provide event.clipboardData
    // we keep the copied data for internal use.
    // Then we have copy'n'paste at least within one app
    Clipboard.clipboardData = clipboardData;
    // FOR DEBUGGING
    substanceGlobals.clipboardData = clipboardData;
    if (event.clipboardData && clipboardData.doc) {
      event.preventDefault();
      // store as plain text and html
      event.clipboardData.setData('text/plain', clipboardData.text);
      event.clipboardData.setData('text/html', clipboardData.html);
    }
  };

  /*
    Called when cut event fired.

    @param {Event} event
  */
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

  /*
    Called when paste event fired.

    @param {Event} event
  */
  // Works on Safari/Chrome/FF
  this.onPaste = function(event) {
    var clipboardData = event.clipboardData;

    var types = {};
    for (var i = 0; i < clipboardData.types.length; i++) {
      types[clipboardData.types[i]] = true;
    }
    // console.log('onPaste(): received content types', types);

    event.preventDefault();
    event.stopPropagation();

    var plainText;
    var html;
    if (types['text/plain']) {
      plainText = clipboardData.getData('text/plain');
    }
    if (types['text/html']) {
      html = clipboardData.getData('text/html');
    }

    // FOR DEBUGGING
    substanceGlobals.clipboardData = {
      text: plainText,
      html: html
    };
    // console.log('onPaste(): html = ', html);

    // WORKAROUND: FF does not provide HTML coming in from other applications
    // so fall back to pasting plain text
    if (this.isFF && !html) {
      this._pastePlainText(plainText);
      return;
    }

    // if we have content given as HTML we let the importer assess the quality first
    // and fallback to plain text import if it's bad
    if (html) {
      if (Clipboard.NO_CATCH) {
        this._pasteHtml(html, plainText);
      } else {
        try {
          this._pasteHtml(html, plainText);
        } catch (err) {
          this._pastePlainText(plainText);
        }
      }
    } else {
      this._pastePlainText(plainText);
    }
  };

  /*
    Pastes a given plain text into the surface.

    @param {String} plainText plain text
  */
  this._pastePlainText = function(plainText) {
    var surface = this.getSurface();
    surface.transaction(function(tx, args) {
      args.text = plainText;
      return surface.paste(tx, args);
    });
  };

  this.onBeforePasteShim = function() {
    var surface = this.getSurface();
    if (!surface) return;
    // console.log("Clipboard.onBeforePasteShim...");
    // HACK: need to work on the native element here
    var el = this._getNativeElement();
    el.focus();
    var range = document.createRange();
    range.selectNodeContents(el);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  this.onPasteShim = function() {
    // HACK: need to work on the native element here
    var el = this.el;
    el.innerHTML = "";
    var sel = this.surface.getSelection();
    // NOTE: this delay is necessary to let the browser paste into the paste bin
    window.setTimeout(function() {
      this.surface.selection = sel;
      var html = el.innerHTML;
      var text = el.textContent;
      el.innerHTML = "";
      // FOR DEBUGGING
      substanceGlobals.clipboardData = {
        text: text,
        html: html
      };
      if (Clipboard.NO_CATCH) {
        this._pasteHtml(html, text);
      } else {
        try {
          this._pasteHtml(html, text);
        } catch (err) {
          this._pastePlainText(text);
        }
      }
    }.bind(this));
  };

  /*
    Copies data from surface to clipboard.
  */
  this._copy = function() {
    var surface = this.getSurface();
    var sel = surface.getSelection();
    var doc = surface.getDocument();
    var clipboardDoc = null;
    var clipboardText = "";
    var clipboardHtml = "";
    if (!sel.isCollapsed()) {
      clipboardText = documentHelpers.getTextForSelection(doc, sel);
      clipboardDoc = surface.copy(doc, sel);
      clipboardHtml = this.htmlExporter.exportDocument(clipboardDoc);
    }
    return {
      doc: clipboardDoc,
      html: clipboardHtml,
      text: clipboardText
    };
  };

  /*
    Pastes a given parsed html document into the surface.

    @param {ui/DOMElement} docElement
    @param {String} text plain text representation used as a fallback
  */
  this._pasteHtml = function(html, text) {
    var surface = this.getSurface();
    if (!surface) return;
    // TODO: the clipboard importer should make sure
    // that the container exists
    var content = this.htmlImporter.importDocument(html);
    if (content) {
      surface.transaction(function(tx, args) {
        args.text = text;
        args.doc = content;
        return surface.paste(tx, args);
      });
      return true;
    }
  };

  this._getNativeElement = function() {
    return this.el.el;
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
