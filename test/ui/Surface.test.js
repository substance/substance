/* eslint-disable no-invalid-this */
"use strict";

require('../QUnitExtensions');

var createAnnotation = require('../../model/transform/createAnnotation');
var DocumentSession = require('../../model/DocumentSession');
var Component = require('../../ui/Component');

var TestContainerEditor = require('./TestContainerEditor');
var simple = require('../fixtures/simple');

var components = {
  "paragraph": require('../../packages/paragraph/ParagraphComponent')
};

QUnit.uiModule('ui/Surface');

function _createSurface(doc, el) {
  var documentSession = new DocumentSession(doc);
  var app = Component.mount(TestContainerEditor, {
    doc: doc,
    documentSession: documentSession,
    config: {
      controller: {
        components: components,
        commands: [],
      }
    }
  }, el);
  var surface = app.refs.editor;
  return surface;
}

// This test was added to cover issue #82
QUnit.uiTest("Set the selection after creating annotation.", function(assert) {
  var el = this.sandbox;
  var doc = simple();
  var surface = _createSurface(doc, el);
  // surface.setFocused(true);
  var sel = doc.createSelection(['p1', 'content'], 0, 5);
  surface.setSelection(sel);
  surface.transaction(function(tx, args) {
    args.selection = sel;
    args.node = {type: "strong"};
    args = createAnnotation(tx, args);
    return args;
  });
  var wsel = window.getSelection();
  var newSel = surface.domSelection.getSelection();
  assert.equal(wsel.rangeCount, 1, "There should be a DOM selection.");
  assert.equal(newSel.toString(), sel.toString(), "New selection should be equal to initial selection.");
});

QUnit.uiTest("Render a reverse selection.", function(assert) {
  var BrowserDOMElement = require('../../ui/BrowserDOMElement');
  var el = this.sandbox;
  var doc = simple();
  var surface = _createSurface(doc, el);
  // surface.setFocused(true);
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'main',
    startPath:['p1', 'content'],
    startOffset: 3,
    endPath: ['p2', 'content'],
    endOffset: 2,
    reverse: true
  });
  surface.setSelection(sel);
  var wsel = BrowserDOMElement.getWindowSelection();
  assert.ok(BrowserDOMElement.isReverse(wsel.anchorNode, wsel.anchorOffset, wsel.focusNode, wsel.focusOffset));
});
