"use strict";

require('../phantomjs_shims');
var ContainerEditor = require('../../../ui/surface/container_editor');
var Component = require('../../../ui/component');
var $$ = Component.$$;
var Controller = require('../../../ui/controller');
var simple = require('../../fixtures/simple');
var createAnnotation = require('../../../document/transformations/create_annotation');

var components = {
  "paragraph": require('../../../ui/nodes/paragraph_component')
};

QUnit.uiModule('Surface');

// This test was added to cover issue #82
QUnit.test("Set the selection after creating annotation.", function(assert) {
  var doc = simple();

  // TODO: We should find a way to test a surface without the extra infrastructure
  var MyApp = Controller.extend({
    render: function() {
      return $$('div').append(
        $$(ContainerEditor, {
          doc: this.props.doc,
          containerId: 'main',
          name: 'main'
        }).ref('editor')
      );
    }
  });

  var app = Component.mount($$(MyApp, {
    doc: doc,
    config: {
      components: components,
      commands: [],
    }
  }), $('#qunit-fixture'));

  var surface = app.refs.editor;

  surface.setFocused(true);
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    endOffset: 5
  });
  surface.setSelection(sel);
  // this should blur the surface which should persist the selection
  surface.$el.blur();
  surface.transaction(function(tx, args) {
    args.selection = sel;
    args.annotationType = "strong";
    args = createAnnotation(tx, args);
    return args;
  });
  surface.el.focus();
  var wsel = window.getSelection();
  var newSel = surface.surfaceSelection.getSelection();
  assert.equal(wsel.rangeCount, 1, "There should be a DOM selection.");
  assert.ok(newSel.equals(sel), "New selection should be equal to initial selection.");
});
