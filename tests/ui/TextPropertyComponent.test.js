"use strict";

var test = require('../test').UI;

var isNull = require('lodash/isNull');
var isUndefined = require('lodash/isUndefined');

var Component = require('../../ui/Component');
var TextPropertyComponent = require('../../ui/TextPropertyComponent');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');

function isDefinedAndNotNull(t, x, msg) {
  return t.ok(!isNull(x) && !isUndefined(x), msg);
}

test("Get coordinate of empty property", function(t) {
  var doc = fixture(simple);
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

  isDefinedAndNotNull(t, coor, 'Coordinate should be not null.');
  t.equal(coor.container, comp.el.getNativeElement(), 'element should be property element');
  t.equal(coor.offset, 0, 'offset should be 0');
  t.end();
});
