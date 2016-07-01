"use strict";

var oo = require('../util/oo');
var platform = require('../util/platform');
var substanceGlobals = require('../util/substanceGlobals');
var documentHelpers = require('../model/documentHelpers');
var ClipboardImporter = require('./ClipboardImporter');
var ClipboardExporter = require('./ClipboardExporter');

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
}

Clipboard.Prototype = function() {

  this.getSurface = function() {
    return this.surface;
  };

  /*
    Called by to enable clipboard handling on a given root element.
  */
  this.attach = function(el) {
    el.on('copy', this.onCopy, this);
    el.on('cut', this.onCut, this);
    if (platform.isIE && !platform.isEdge) {
      el.on('beforepaste', this.onBeforePasteShim, this);
    } else {
      el.on('paste', this.onPaste, this);
    }
  };

  /*
    Called by to disable clipboard handling.
  */
  this.detach = function(el) {
    el.off(this);
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
    substanceGlobals._clipboardData = event.clipboardData;
    if (event.clipboardData && clipboardData.doc) {
      event.preventDefault();
      // store as plain text and html
      event.clipboardData.setData('text/plain', clipboardData.text);
      // WORKAROUND: under IE and Edge it is not permitted to set 'text/html'
      if (!platform.isIE && !platform.isEdge) {
        event.clipboardData.setData('text/html', clipboardData.html);
      }
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

    // HACK: to allow at least in app copy and paste under Edge (which blocks HTML)
    // we guess by comparing the old and new plain text
    if (platform.isEdge &&
        substanceGlobals.clipboardData &&
        substanceGlobals.clipboardData.text === plainText) {
      html = substanceGlobals.clipboardData.html;
    } else {
      substanceGlobals.clipboardData = {
        text: plainText,
        html: html
      };
    }

    // console.log('onPaste(): html = ', html);

    // WORKAROUND: FF does not provide HTML coming in from other applications
    // so fall back to pasting plain text
    if (platform.isFF && !html) {
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
    var pasteEl = this._createPasteBin();
    var el = pasteEl.getNativeElement();
    el.focus();
    var range = window.document.createRange();
    range.setStart(el.firstChild, 0);
    range.setEnd(el.firstChild, 1);
    var wsel = window.getSelection();
    wsel.removeAllRanges();
    wsel.addRange(range);
  };

  // creates a contenteditable element which is used
  // to redirect a native paste into
  this._createPasteBin = function() {
    var el = this.surface.el.createElement('div')
      .attr('contenteditable', true)
      .attr('tabindex', -1)
      .css({
        position: 'fixed',
        opacity: '0.0',
        bottom: '-1000px',
        // width: '0px'
      })
      .append(" ")
      .on('beforepaste', function(event) {
        event.stopPropagation();
      })
      .on('paste', function(event) {
        this.onPasteShim(el);
        event.stopPropagation();
      }.bind(this));
    this.surface.el.appendChild(el);
    return el;
  };

  this.onPasteShim = function(pasteEl) {
    // NOTE: this delay is necessary to let the browser paste into the paste bin
    window.setTimeout(function() {
      // console.log('Clipboard.onPasteShim()...');
      var html = pasteEl.innerHTML;
      var text = pasteEl.textContent;
      // console.log('### ... text: %s, html: %s', text, html);
      pasteEl.remove();
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
      clipboardText = documentHelpers.getTextForSelection(doc, sel) || "";
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
