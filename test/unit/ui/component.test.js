"use strict";

var Component = require('../../../ui/component');
var $$ = Component.$$;

QUnit.uiModule('Substance.Component');

var SimpleComponent = Component.extend({
  didInitialize: function() {
    // make some methods inspectable
    this.didMount = sinon.spy(this, 'didMount');
    this.shouldRerender = sinon.spy(this, 'shouldRerender');
    this.render = sinon.spy(this, 'render');
  },
  render: function() {
    var el = $$('div').addClass('simple-component');
    if (this.props.children) {
      el.append(this.props.children);
    }
    return el;
  }
});

QUnit.test("Every component should have a parent", function(assert) {
  assert.throws(function() {
    new Component();
  }, "Should throw an exception when no parent is given.");
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

QUnit.test("Render an element with custom html", function(assert) {
  var comp = $$('div').html('Hello <b>World</b>')._render();
  assert.ok(comp.$el.find('b').length, 'Element should have rendered HTML as content.');
  assert.equal(comp.$el.find('b').text(), 'World','Rendered element should have right content.');
});

QUnit.test("Render a component", function(assert) {
  var comp = $$(SimpleComponent)._render();
  assert.equal(comp.$el[0].tagName.toLowerCase(), 'div', 'Element should be a "div".');
  assert.ok(comp.$el.hasClass('simple-component'), 'Element should have class "simple-component".');
});

QUnit.test("Render nested elements", function(assert) {
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

/** Differential rerendering **/

QUnit.test("Preserve a child with key", function(assert) {
  var comp = Component._render($$('div')
    .append($$(SimpleComponent).key('foo')));
  var child = comp.refs.foo;
  var el = child.$el[0];
  // rerender using the same virtual dom
  comp._render($$('div')
    .append($$(SimpleComponent).key('foo')));
  assert.ok(comp.refs.foo === child, 'Child component should have been preserved.');
  assert.ok(comp.refs.foo.$el[0] === el, 'Child element should have been preserved.');
});

QUnit.test("Wipe a child without key", function(assert) {
  var comp = Component._render($$('div')
    .append($$(SimpleComponent)));
  var child = comp.children[0];
  var el = child.$el[0];
  // rerender using the same virtual dom
  comp._render($$('div')
    .append($$(SimpleComponent)));
  // as we did not apply a key, the component simply gets rerendered from scratch
  assert.ok(comp.children[0] !== child, 'Child component should have been preserved.');
  assert.ok(comp.children[0].$el[0] !== el, 'Child element should have been preserved.');
});

QUnit.test("Don't do a deep rerender when only attributes/classes/styles change.", function(assert) {
  var comp = Component._render($$('div')
    .attr('data-foo', 'bar')
    .addClass('foo')
    .css('width', 100)
    .append($$(SimpleComponent)));
  var render = sinon.spy(comp, 'render');
  // rerender with changed attributes, classes and css styles
  comp._render($$('div')
    .attr('data-foo', 'baz')
    .addClass('bar')
    .css('width', 200)
    .append($$(SimpleComponent)));
  assert.equal(comp.$el.attr('data-foo'), 'baz', 'Data attribute should be up-to-date.');
  assert.ok(!comp.$el.hasClass('foo') && comp.$el.hasClass('bar'), 'Element classes should be up-to-date.');
  assert.equal(comp.$el.css('width'), "200px", "Element style should be up-to-date.");
  assert.equal(render.callCount, 0, "Component should not have been rerendered.");
});

QUnit.test("Do deep rerender when properties have changed.", function(assert) {
  var comp = Component._render($$(SimpleComponent, { foo: 'bar '}));
  // rerender with changed attributes
  comp.setProps({ foo: 'baz' });
  assert.equal(comp.shouldRerender.callCount, 1, "Component should have been asked whether to rerender.");
  assert.equal(comp.render.callCount, 2, "Component should have been rerendered.");
});

QUnit.test("Do deep rerender when state has changed.", function(assert) {
  var comp = Component._render($$(SimpleComponent));
  // rerender with changed attributes
  comp.setState({ foo: 'baz' });
  assert.equal(comp.shouldRerender.callCount, 1, "Component should have been asked whether to rerender.");
  assert.equal(comp.render.callCount, 2, "Component should have been rerendered.");
 });

QUnit.test("Only call didMount once.", function(assert) {
  var Child = Component.extend({
    render: function() {
      if (this.props.loading) {
        return $$('div').append('Loading...');
      } else {
        return $$('div').append(
          $$(SimpleComponent).key('child')
        );
      }
    },
  });
  var Parent = Component.extend({
    render: function() {
      return $$('div')
        .append($$(Child).key('child').setProps({ loading: true}));
    },
    didMount: function() {
      this.refs.child.setProps({ loading: false });
    }
  });
  var comp = Component.mount($$(Parent), $('#qunit-fixture'));
  assert.equal(comp.refs.child.refs.child.didMount.callCount, 1, "Childrens' didMount should have been called only once.");
});
