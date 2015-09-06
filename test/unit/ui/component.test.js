"use strict";

var Component = require('../../../ui/component');
var $$ = Component.$$;

QUnit.uiModule('Substance.Component');

var SimpleComponent = Component.extend({
  render: function() {
    return $$('div').addClass('simple-component');
  }
});

QUnit.test("Render an HTML element", function(assert) {
  var comp = $$('div')._render();
  assert.equal(comp.$el[0].tagName.toLowerCase(), 'div', 'Element should be a "div".');
  comp = $$('span')._render();
  assert.equal(comp.$el[0].tagName.toLowerCase(), 'span', 'Element should be a "span".');
});

QUnit.test("Render an element with attributes", function(assert) {
  var comp = $$('div').attr('data-id', 'foo')._render();
  assert.equal(comp.$el.attr('data-id'), 'foo', 'Element should be have data-id="foo".');
});

QUnit.test("Render an element with css styles", function(assert) {
  var comp = $$('div').css('width', 100)._render();
  assert.equal(comp.$el.css('width'), "100px", 'Element should have a css width of 100px.');
});

QUnit.test("Render an element with classes", function(assert) {
  var comp = $$('div').addClass('test')._render();
  assert.ok(comp.$el.hasClass('test'), 'Element should have class "test".');
});

QUnit.test("Render a component", function(assert) {
  var comp = $$(SimpleComponent)._render();
  assert.equal(comp.$el[0].tagName.toLowerCase(), 'div', 'Element should be a "div".');
  assert.ok(comp.$el.hasClass('simple-component'), 'Element should have class "simple-component".');
});
