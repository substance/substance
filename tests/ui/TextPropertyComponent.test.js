"use strict";

var test = require('../test').module('ui/TextPropertyComponent');

var Component = require('../../ui/Component');
var TextPropertyComponent = require('../../ui/TextPropertyComponent');

var fixture = require('../fixtures/createTestArticle');
var simple = require('../fixtures/simple');

test.UI("Get coordinate of empty property", function(t) {
  var doc = fixture(simple);
  doc.create({
    type: 'paragraph',
    id: 'empty',
    content: ''
  });
  var comp = Component.mount(TextPropertyComponent, {
    doc: doc,
    path: ['empty', 'content']
  }, t.sandbox);

  var coor = comp.getDOMCoordinate(0);

  t.notNil(coor, 'Coordinate should be not null.');
  t.equal(coor.container, comp.el.getNativeElement(), 'element should be property element');
  t.equal(coor.offset, 0, 'offset should be 0');
  t.end();
});
