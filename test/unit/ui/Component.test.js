"use strict";

require('../qunit_extensions');

var sinon = require('sinon');
var isEqual = require('lodash/isEqual');
var Component = require('../../../ui/Component');
var $$ = Component.$$;
var $ = require('../../../util/jquery');

QUnit.uiModule('ui/Component');

var TestComponent = Component.extend({
  spiesEnabled: true,
  _enableSpies: function() {
    ['didMount','didRender','dispose','shouldRerender','render'].forEach(function(name) {
      this[name] = sinon.spy(this, name);
    }.bind(this));
  },
  _disableSpies: function() {
    ['didMount','didRender','dispose','shouldRerender','render'].forEach(function(name) {
      this[name].restore();
    }.bind(this));
  },
  initialize: function() {
    // make some methods inspectable
    // this.didMount = sinon.spy(this, 'didMount');
    // this.didRender = sinon.spy(this, 'didRender');
    // this.dispose = sinon.spy(this, 'dispose');
    // this.shouldRerender = sinon.spy(this, 'shouldRerender');
    // this.render = sinon.spy(this, 'render');
    if (this.spiesEnabled) {
      this._enableSpies();
    }
  }
});

var SimpleComponent = TestComponent.extend({
  render: function() {
    var el = $$('div').addClass('simple-component');
    if (this.props.children) {
      el.append(this.props.children);
    }
    return el;
  }
});

var ClickableComponent = Component.extend({
  initialize: function() {
    this.__clickCount = 0;
  },
  render: function() {
    var el = $$('a').append('Click me').attr('href', '#');
    if (this.props.useInlineHandler) {
      el.on('click', function() {
        this.__clickCount += 1;
        this.rerender();
      });
    } else {
      el.on('click', this.onClick);
    }
    return el;
  },
  onClick: function() {
    this.__clickCount += 1;
    this.rerender();
  }
});

QUnit.test("Every component should have a parent", function(assert) {
  assert.throws(function() {
    new Component();
  }, "Should throw an exception when no parent is given.");
});

QUnit.test("Throw error when render method is not returning an element", function(assert) {
  var MyComponent = TestComponent.extend({
    displayName: 'MyComponent',
    render: function() {}
  });
  assert.throws(function() {
    $$(MyComponent)._render();
  }, "Should throw an exception when render does not return an element");
});

QUnit.uiTest("Different mount scenarios", function(assert) {
  // Mount to a detached element
  var el = $('<div>')[0];
  var comp = Component.mount(SimpleComponent, el);
  assert.equal(comp.didMount.callCount, 0, "didMount must not be called when mounting to detached elements");
  assert.equal(comp.didRender.callCount, 1, "didRender must have been called once");
  assert.isDefinedAndNotNull(comp.el);

  // Mount to an existing DOM element (this time we pass a jQuery element which is also supported)
  comp = Component.mount(SimpleComponent, '#qunit-fixture');
  assert.equal(comp.didMount.callCount, 1, "didMount must not be called when mounting to attached elements");
  assert.equal(comp.didRender.callCount, 1, "didRender must have been called once");
  assert.isDefinedAndNotNull(comp.el);
});

QUnit.test("Render an HTML element", function(assert) {
  var comp = Component.render(function() {
    return $$('div');
  });
  assert.equal(comp.el.tagName.toLowerCase(), 'div', 'Element should be a "div".');
  comp = Component.render(function() {
    return $$('span');
  });
  assert.equal(comp.el.tagName.toLowerCase(), 'span', 'Element should be a "span".');
});

QUnit.test("Render an element with attributes", function(assert) {
  var comp = Component.render(function() {
    return $$('div').attr('data-id', 'foo');
  });
  assert.equal(comp.$el.attr('data-id'), 'foo', 'Element should be have data-id="foo".');
});

QUnit.uiTest("Render an element with css styles", function(assert) {
  var comp = Component.render(function() {
    return $$('div').css('width', 100);
  });
  assert.equal(comp.$el.css('width'), "100px", 'Element should have a css width of 100px.');
});

QUnit.test("Render an element with classes", function(assert) {
  var comp = Component.render(function() {
    return $$('div').addClass('test');
  });
  assert.ok(comp.$el.hasClass('test'), 'Element should have class "test".');
});

QUnit.uiTest("Render an element with properties", function(assert) {
  var comp = Component.render(function() {
    return $$('input').htmlProp({ type: 'text', value: 'foo' });
  });
  assert.equal(comp.$el.prop('tagName').toLowerCase(), 'input', 'Element should be an input element.');
  assert.equal(comp.$el.prop('type'), 'text', '... with type "text"');
  assert.equal(comp.$el.prop('value'), 'foo', '... and value "foo"');
});

QUnit.test("Render an element with value", function(assert) {
  var comp = Component.render(function() {
    return $$('input').htmlProp({ type: 'text'}).val('foo');
  });
  assert.equal(comp.$el.val(), 'foo', 'Value should be set.');
});

QUnit.test("Render an element with custom html", function(assert) {
  var comp = Component.render(function() {
    return $$('div').html('Hello <b>World</b>');
  });
  assert.equal(comp.$el.find('b').length, 1, 'Element should have rendered HTML as content.');
  assert.equal(comp.$el.find('b').text(), 'World','Rendered element should have right content.');
});

QUnit.test("Render a component", function(assert) {
  var comp = Component.render(SimpleComponent);
  assert.equal(comp.el.tagName.toLowerCase(), 'div', 'Element should be a "div".');
  assert.ok(comp.$el.hasClass('simple-component'), 'Element should have class "simple-component".');
});

QUnit.test("Render nested elements", function(assert) {
  var comp = Component.render(function() {
    return $$('div').addClass('parent')
      .append($$('div').addClass('child1'))
      .append($$('div').addClass('child2'));
  });
  assert.equal(comp.children.length, 2, 'Component should have two children.');
  assert.ok(comp.$el.hasClass('parent'), 'Element should have class "parent".');
  assert.ok(comp.children[0].$el.hasClass('child1'), 'First child should have class "child1".');
  assert.ok(comp.children[1].$el.hasClass('child2'), 'Second child should have class "child2".');
});

QUnit.test("Render a component with children", function(assert) {
  // Note: in case of custom components you should provide children via
  // props, instead of using append. The render method of the custom
  // needs to take care of 'placing' the children.
  var comp = Component.render(SimpleComponent, {
    children: [
      $$('div').addClass('child1'),
      $$('div').addClass('child2')
    ]
  });
  assert.equal(comp.children.length, 2, 'Component should have two children.');
  assert.ok(comp.children[0].$el.hasClass('child1'), 'First child should have class "child1".');
  assert.ok(comp.children[1].$el.hasClass('child2'), 'Second child should have class "child2".');
});

QUnit.test("Render a child with ref", function(assert) {
  var comp = Component.render(function() {
    return $$('div').addClass('parent')
      .append($$('div').addClass('child').ref('foo'));
  });
  assert.isDefinedAndNotNull(comp.refs.foo, 'Component should have a ref "foo".');
  assert.ok(comp.refs.foo.$el.hasClass('child'), 'Referenced component should have class "child".');
});

/** JQuery style API for accessing HTML data **/

QUnit.test("Accessing an attribute via comp.attr()", function(assert) {
  var comp = Component.render(function() {
    return $$('div').attr('data-id', 'foo');
  });
  assert.equal(comp.attr('data-id'), 'foo', 'Element should be have data-id="foo".');
});

QUnit.test("Checking a class via comp.hasClass()", function(assert) {
  var comp = Component.render(function() {
    return $$('div').addClass('foo');
  });
  assert.ok(comp.hasClass('foo'), 'Element should have class "foo".');
});

QUnit.test("Accessing a HTML property via comp.htmlProp()", function(assert) {
  var comp = Component.render(function() {
    return $$('input').htmlProp('type', 'text');
  });
  assert.equal(comp.htmlProp('type'), 'text', 'Input field should be of type "text".');
});

QUnit.test("Accessing the HTML value via comp.val()", function(assert) {
  var comp = Component.render(function() {
    return $$('input').htmlProp('type', 'text').val('foo');
  });
  assert.equal(comp.val(), 'foo', 'Input field should have value "foo".');
});

QUnit.test("Getting plain text via comp.text()", function(assert) {
  var comp = Component.render(function() {
    return $$('div').append('foo');
  });
  assert.equal(comp.text(), 'foo', 'Element should have text "foo".');
});

/** Differential rerendering **/

QUnit.test("Preserve a child with ref", function(assert) {
  var comp = Component.render(function() {
    return $$('div').append(
      $$(SimpleComponent).ref('foo')
    );
  });
  var child = comp.refs.foo;
  var el = child.el;
  comp.rerender();
  assert.ok(comp.refs.foo === child, 'Child component should have been preserved.');
  assert.ok(comp.refs.foo.el === el, 'Child element should have been preserved.');
});

QUnit.test("Wipe a child without ref", function(assert) {
  var comp = Component.render(function() {
    return $$('div').append(
      $$(SimpleComponent)
    );
  });
  var child = comp.children[0];
  var el = child.el;
  // rerender using the same virtual dom
  comp.rerender();
  // as we did not apply a ref, the component simply gets rerendered from scratch
  assert.ok(comp.children[0] !== child, 'Child component should have been preserved.');
  assert.ok(comp.children[0].el !== el, 'Child element should have been preserved.');
});

QUnit.test("Do deep rerender when properties have changed.", function(assert) {
  var comp = Component.render(SimpleComponent, { foo: 'bar '});
  // rerender with changed attributes
  comp.setProps({ foo: 'baz' });
  assert.equal(comp.shouldRerender.callCount, 1, "Component should have been asked whether to rerender.");
  assert.equal(comp.render.callCount, 2, "Component should have been rerendered.");
});

QUnit.test("Do deep rerender when state has changed.", function(assert) {
  var comp = Component.render(SimpleComponent);
  // rerender with changed attributes
  comp.setState({ foo: 'baz' });
  assert.equal(comp.shouldRerender.callCount, 1, "Component should have been asked whether to rerender.");
  assert.equal(comp.render.callCount, 2, "Component should have been rerendered.");
});

QUnit.uiTest("Only call didMount once for childs and grandchilds when setProps is called during mounting process.", function(assert) {
  var Child = TestComponent.extend({
    render: function() {
      if (this.props.loading) {
        return $$('div').append('Loading...');
      } else {
        return $$('div').append(
          $$(SimpleComponent).ref('child')
        );
      }
    },
  });
  var Parent = TestComponent.extend({
    render: function() {
      return $$('div')
        .append($$(Child).ref('child').setProps({ loading: true}));
    },
    didMount: function() {
      this.refs.child.setProps({ loading: false });
    }
  });

  var comp = Component.mount(Parent, '#qunit-fixture');
  var childComp = comp.refs.child;
  var grandChildComp = childComp.refs.child;
  assert.equal(childComp.didMount.callCount, 1, "Child's didMount should have been called only once.");
  assert.equal(grandChildComp.didMount.callCount, 1, "Grandchild's didMount should have been called only once.");

  comp.empty();
  assert.equal(childComp.dispose.callCount, 1, "Child's dispose should have been called once.");
  assert.equal(grandChildComp.dispose.callCount, 1, "Grandchild's dispose should have been called once.");
});

// TODO: The next test case covers most of this, so maybe we can remove it in the future
QUnit.test('Propagate properties to child components when setProps called on parent', function(assert) {
  var ItemComponent = TestComponent.extend({
    render: function() {
      return $$('div').append(this.props.name);
    }
  });
  var CompositeComponent = TestComponent.extend({
    render: function() {
      var el = $$('div').addClass('composite-component');
      this.props.items.forEach(function(item) {
        el.append($$(ItemComponent, item));
      });
      return el;
    }
  });

  var comp = Component.render(CompositeComponent, {
    items: [ {name: 'A'}, {name: 'B'} ]
  });
  assert.equal(comp.children.length, 2, 'Component should have two children.');
  assert.equal(comp.children[0].$el.text(), 'A', 'First child should have text A');
  assert.equal(comp.children[1].$el.text(), 'B', 'First child should have text B');

  // Now we are gonna set new props
  comp.setProps({
    items: [ {name: 'X'}, {name: 'Y'} ]
  });
  assert.equal(comp.children.length, 2, 'Component should have two children.');
  assert.equal(comp.children[0].$el.text(), 'X', 'First child should have text X');
  assert.equal(comp.children[1].$el.text(), 'Y', 'First child should have text Y');
});


QUnit.test('Preserve components when ref matches, and rerender when props changed', function(assert) {
  var ItemComponent = TestComponent.extend({
    shouldRerender: function(nextProps) {
      return !isEqual(nextProps, this.props);
    },
    render: function() {
      return $$('div').append(this.props.name);
    }
  });
  var CompositeComponent = TestComponent.extend({
    render: function() {
      var el = $$('div').addClass('composite-component');
      this.props.items.forEach(function(item) {
        el.append($$(ItemComponent, item).ref(item.ref));
      });
      return el;
    }
  });

  // Initial mount
  var comp = Component.mount(CompositeComponent, {
    items: [
      {ref: 'a', name: 'A'},
      {ref: 'b', name: 'B'},
      {ref: 'c', name: 'C'}
    ]
  }, '#qunit-fixture');

  var a = comp.refs.a;
  var b = comp.refs.b;
  var c = comp.refs.c;
  var aEl = a.$el[0];
  var bEl = b.$el[0];

  assert.equal(comp.children.length, 3, 'Component should have three children.');
  assert.equal(comp.children[0].$el.text(), 'A', 'First child should have text A');
  assert.equal(comp.children[1].$el.text(), 'B', 'First child should have text B');
  assert.equal(comp.children[2].$el.text(), 'C', 'First child should have text C');

  // Props update that preserves some of our components, drops some others
  // and adds some new
  comp.setProps({
    items: [
      {ref: 'a', name: 'X'}, // preserved (props changed)
      {ref: 'd', name: 'Y'}, // new
      {ref: 'b', name: 'B'}, // preserved (same props)
      {ref: 'e', name: 'Z'}  // new
    ]
  });

  // a and b should have been preserved
  assert.equal(a, comp.children[0], 'a should be the same instance');
  assert.equal(b, comp.children[2], 'b should be the same component instance');

  // c should be gone
  assert.equal(c.dispose.callCount, 1, 'c should have been unmounted');

  // a should have been rerendered (different props) while b should not (same props)
  assert.equal(a.render.callCount, 2, 'Component with ref a should have been rendered twice');
  assert.equal(b.render.callCount, 1, 'Component with ref b should have been rendered once');

  assert.equal(comp.children.length, 4, 'Component should have 4 children.');
  assert.equal(comp.children[0].text(), 'X', 'First child should have text X');
  assert.equal(comp.children[1].text(), 'Y', 'First child should have text Y');
  assert.equal(comp.children[2].text(), 'B', 'First child should have text Y');
  assert.equal(comp.children[3].text(), 'Z', 'First child should have text Z');

  // Actually I don't have the full understanding yet, why aEl is the same after rerender.
  // It means that the rerender is smart enough to reuse the element. What if the tag had changed?
  assert.equal(aEl, comp.children[0].el, 'DOM element for a should be the same after rerender');
  assert.equal(bEl, comp.children[2].el, 'DOM element for b should be the same, since there was no rerender');
});

QUnit.test("Refs in grand child components.", function(assert) {
  var Parent = TestComponent.extend({
    render: function() {
      var el = $$('div');
      var child = $$('div').ref('child');
      var grandChild = $$('div').ref(this.props.grandChildRef);
      return el.append(child.append(grandChild));
    },
  });
  var comp = Component.render(Parent, { grandChildRef: "foo"});
  assert.isDefinedAndNotNull(comp.refs.foo, "Ref 'foo' should be set.");
  comp.setProps({ grandChildRef: "bar" });
  assert.isDefinedAndNotNull(comp.refs.bar, "Ref 'bar' should be set.");
});

QUnit.test("Cascaded updates of HTML attributes.", function(assert) {
  var Child = TestComponent.extend({
    render: function() {
      return $$('input').htmlProp('type', 'text');
    }
  });
  var Parent = TestComponent.extend({
    render: function() {
      var el = $$('div');
      var child = $$(Child).ref('child');
      if (this.props.childAttr) {
        child.attr(this.props.childAttr);
      }
      if (this.props.childClass) {
        child.addClass(this.props.childClass);
      }
      if (this.props.childHtmlProps) {
        child.htmlProp(this.props.childHtmlProps);
      }
      if (this.props.childCss) {
        child.css(this.props.childCss);
      }
      return el.append(child);
    },
  });
  var comp = Component.render(Parent);
  comp.setProps({ childAttr: { "data-id": "child" } });
  assert.equal(comp.refs.child.attr('data-id'), 'child', "Child component should have updated attribute.");
  comp.setProps({ childClass: "child" });
  assert.ok(comp.refs.child.hasClass('child'), "Child component should have updated class.");
  comp.setProps({ childHtmlProps: { "value": "child" } });
  assert.equal(comp.refs.child.val(), "child", "Child component should have updated html property.");
  comp.setProps({ childCss: { "width": "50px" } });
  assert.equal(comp.refs.child.css('width'), "50px", "Child component should have updated css style.");
});

QUnit.test("Component.append() should support appending text.", function(assert) {
  var comp = Component.render(SimpleComponent);
  comp.append('XXX');
  assert.equal(comp.text(), 'XXX');
});

QUnit.test("Should wipe a referenced component when class changes", function(assert) {
  var ComponentA = TestComponent.extend({
    render: function() {
      return $$('div').addClass('component-a');
    }
  });
  var ComponentB = TestComponent.extend({
    render: function() {
      return $$('div').addClass('component-b');
    }
  });
  var MainComponent = TestComponent.extend({
    render: function() {
      var el = $$('div').addClass('context');
      var ComponentClass;
      if (this.props.context ==='A') {
        ComponentClass = ComponentA;
      } else {
        ComponentClass = ComponentB;
      }
      el.append($$(ComponentClass).ref('context'));
      return el;
    }
  });
  var comp = Component.mount(MainComponent, {context: 'A'}, '#qunit-fixture');
  assert.ok(comp.refs.context instanceof ComponentA, 'Context should be of instance ComponentA');
  comp.setProps({context: 'B'});
  assert.ok(comp.refs.context instanceof ComponentB, 'Context should be of instance ComponentB');
});

QUnit.uiTest('Click handlers should not leak', function(assert) {

  // Using a this.onClick handler defined on prototype
  var comp = Component.render(ClickableComponent);
  comp.el.click();
  assert.equal(comp.__clickCount, 1, 'onClick handler should have been called once');
  comp.el.click();
  assert.equal(comp.__clickCount, 2, 'onClick handler should have been called twice');
  comp.el.click();
  assert.equal(comp.__clickCount, 3, 'onClick handler should have been called thrice');

  // Using inline handler
  comp = Component.render(ClickableComponent, {useInlineHandler: true});
  comp.el.click();
  assert.equal(comp.__clickCount, 1, 'onClick handler should have been called once');
  comp.el.click();
  assert.equal(comp.__clickCount, 2, 'onClick handler should have been called twice');
  comp.el.click();
  assert.equal(comp.__clickCount, 3, 'onClick handler should have been called thrice');
});

QUnit.test('Should store refs always on owners', function(assert) {
  var MyComponent = TestComponent.extend({
    render: function() {
      return $$('div').append(
        $$(SimpleComponent).append(
          $$('div').ref('helloComp')
        ).ref('simpleComp')
      );
    }
  });

  var comp = Component.render(MyComponent);
  assert.ok(comp.refs.helloComp, 'There should stil be a ref to the helloComp element/component');
});

// HACK: this is more of an integration test, but I did not manage to isolate the error
// maybe the solution gets us closer to what actually went wrong.
QUnit.test("Refs should survive rerenders", function(assert) {
  var ComponentWithRefs = Component.extend({
    getInitialState: function() {
      return {contextid: 'hello'};
    },
    render: function() {
      var el = $$('div').addClass('lc-lens lc-writer sc-controller');

      var workspace = $$('div').ref('workspace').addClass('le-workspace');

      workspace.append(
        // Main (left column)
        $$('div').ref('main').addClass("le-main").append(
          $$(SimpleComponent).ref('toolbar').append($$(SimpleComponent)),

          $$(SimpleComponent).ref('contentPanel').append(
            $$(SimpleComponent).ref('coverEditor'),

            // The full fledged document (ContainerEditor)
            $$("div").ref('main').addClass('document-content').append(
              $$(SimpleComponent, {
              }).ref('mainEditor')
            ),
            $$(SimpleComponent).ref('bib')
          )
        )
      );

      // Context section (right column)
      workspace.append(
        $$(SimpleComponent, {
        }).ref(this.state.contextId)
      );

      el.append(workspace);

      // Status bar
      el.append(
        $$(SimpleComponent, {}).ref('statusBar')
      );
      return el;
    }
  });

  var comp = Component.render(ComponentWithRefs);
  assert.ok(comp.refs.contentPanel, 'There should be a ref to the contentPanel component');
  comp.setState({contextId: 'foo'});
  assert.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
  comp.setState({contextId: 'bar'});
  assert.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
  comp.setState({contextId: 'baz'});
  assert.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
});

QUnit.test("#312: refs should be bound to the owner, not to the parent.", function(assert) {
  var Child = TestComponent.extend({
    render: function() {
      return $$('div').append(this.props.children);
    }
  });
  var Parent = TestComponent.extend({
    render: function() {
      var el = $$('div');
      el.append(
        $$(Child).append(
          $$('div').ref('foo').append('foo')
        )
      );
      return el;
    }
  });
  var comp = Component.render(Parent);
  assert.isDefinedAndNotNull(comp.refs.foo, 'Ref should be bound to owner.');
  assert.equal(comp.refs.foo.text(), 'foo', 'Ref should point to the right component.');
});

QUnit.test("Preserving grand children using refs.", function(assert) {
  var Grandchild = TestComponent.extend({
    spiesEnabled: false,
    render: function() {
      return $$('div').append(this.props.foo);
    },
  });
  var Parent = TestComponent.extend({
    spiesEnabled: false,
    render: function() {
      var el = $$('div');
      el.append(
        $$('div').ref('child').append(
          // generating a random property making sure the grandchild gets rerendered
          $$(Grandchild, { foo: ""+Date.now() }).ref('grandchild')
        )
      );
      return el;
    },
  });
  var comp = Component.render(Parent);
  assert.isDefinedAndNotNull(comp.refs.child, "Ref 'child' should be set.");
  assert.isDefinedAndNotNull(comp.refs.grandchild, "Ref 'grandchild' should be set.");

  var child = comp.refs.child;
  var grandchild = comp.refs.grandchild;
  comp.rerender();
  assert.isDefinedAndNotNull(comp.refs.child, "Ref 'child' should be set.");
  assert.isDefinedAndNotNull(comp.refs.grandchild, "Ref 'grandchild' should be set.");
  assert.ok(comp.refs.child === child, "'child' should be the same");
  assert.ok(comp.refs.grandchild === grandchild, "'grandchild' should be the same");
});
