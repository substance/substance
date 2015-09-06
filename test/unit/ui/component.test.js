"use strict";

var Component = require('../../../ui/component');
var $$ = Component.$$;

QUnit.uiModule('Substance.Component');

var SimpleComponent = Component.extend({
  render: function() {
    var el = $$('div').addClass('simple-component');
    if (this.props.children) {
      el.append(this.props.children);
    }
    return el;
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

QUnit.test("Render nested element", function(assert) {
  var comp = $$('div').addClass('parent')
    .append($$('div').addClass('child1'))
    .append($$('div').addClass('child2'))
    ._render();
  assert.equal(comp.children.length, 2, 'Component should have two children.');
  assert.ok(comp.$el.hasClass('parent'), 'Element should have class "parent".');
  assert.ok(comp.children[0].$el.hasClass('child1'), 'First child should have class "child1".');
  assert.ok(comp.children[1].$el.hasClass('child2'), 'Second child should have class "child2".');
});

QUnit.test("Render a component with children", function(assert) {
  // Note: in case of custom components you should provide children via
  // props, instead of using append. The render method of the custom
  // needs to take care of 'placing' the children.
  var comp = $$(SimpleComponent, {
    children: [
      $$('div').addClass('child1'),
      $$('div').addClass('child2')
    ]
  })._render();
  assert.equal(comp.children.length, 2, 'Component should have two children.');
  assert.ok(comp.children[0].$el.hasClass('child1'), 'First child should have class "child1".');
  assert.ok(comp.children[1].$el.hasClass('child2'), 'Second child should have class "child2".');
});

QUnit.test("Render a child with key", function(assert) {
  var comp = $$('div').addClass('parent')
    .append($$('div').addClass('child').key('foo'))
    ._render();
  assert.ok(comp.refs.foo, 'Element should have a ref "foo".');
  assert.ok(comp.refs.foo.$el.hasClass('child'), 'Referenced component should have class "child".');
});
