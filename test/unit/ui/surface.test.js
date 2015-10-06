"use strict";

var Surface = require('../../../ui/surface/surface');
var ContainerEditor = require('../../../ui/surface/container_editor');
var Controller = require('../../../ui/controller');
var simple = require('../../fixtures/simple');
var createAnnotation = require('../../../document/transformations/create_annotation');

QUnit.uiModule('Surface');

var simpleHtml = [
  '<div id="surface">',
    '<p data-path="p1.content">ABCDEFG</p>',
  '</div>'
].join('');

// This test was added to cover issue #82
QUnit.test("Set the selection after creating annotation.", function(assert) {
  $('#qunit-fixture').html(simpleHtml);
  var surfaceEl = $('#surface')[0];
  var doc = simple();
  var controller = new Controller(doc, {});
  var editor = new ContainerEditor('main');
  var surface = new Surface(controller, editor);
  surface.attach(surfaceEl);

  surface.setFocused(true);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 5
  });
  surface.setSelection(sel);
  // this should blur the surface which should persist the selection
  $(surfaceEl).blur();
  surface.transaction(function(tx, args) {
    args.selection = sel;
    args.annotationType = "strong";
    args = createAnnotation(tx, args);
    return args;
  });
  $(surfaceEl).focus();
  var wsel = window.getSelection();
  var newSel = surface.surfaceSelection.getSelection();
  assert.equal(wsel.rangeCount, 1, "There should be a DOM selection.");
  assert.ok(newSel.equals(sel), "New selection should be equal to initial selection.");
});
