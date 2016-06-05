"use strict";

require('../QUnitExtensions');

var Component = require('../../ui/Component');
var TextPropertyComponent = require('../../ui/TextPropertyComponent');

var simple = require('../fixtures/simple');

QUnit.uiModule("ui/TextPropertyComponent");

QUnit.uiTest("Get coordinate of empty property", function(assert) {
  var doc = simple();
  doc.create({
    type: 'paragraph',
    id: 'empty',
    content: ''
  });
  var comp = Component.mount(TextPropertyComponent, {
    doc: doc,
    path: ['empty', 'content']
  }, '#qunit-fixture');

  var coor = comp.getDOMCoordinate(0);

  assert.isDefinedAndNotNull(coor, 'Coordinate should be not null.');
  assert.equal(coor.container, comp.el.getNativeElement(), 'element should be property element');
  assert.equal(coor.offset, 0, 'offset should be 0');
});
