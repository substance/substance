"use strict";

require('../qunit_extensions');

var spy = require('../../spy');
var isEqual = require('lodash/isEqual');
var Component = require('../../../ui/Component');
var RenderingEngine = require('../../../ui/RenderingEngine');

var _withSpiesEnabled = false;

function enableSpies() {
  _withSpiesEnabled = true;
}

function TestComponent() {
  TestComponent.super.apply(this, arguments);

  if (_withSpiesEnabled) {
    this._enableSpies();
  }
}

TestComponent.Prototype = function() {

  this._enableSpies = function() {
    ['didMount','didUpdate','dispose','shouldRerender','render'].forEach(function(name) {
      spy(this, name);
    }.bind(this));
  };

  this._disableSpies = function() {
    ['didMount','didUpdate','dispose','shouldRerender','render'].forEach(function(name) {
      this[name].restore();
    }.bind(this));
  };
};

Component.extend(TestComponent);

function renderTestComponent(renderFunc, props) {
  var comp = new TestComponent();
  if (renderFunc) {
    comp.render = renderFunc;
  }
  if (props) {
    comp.setProps(props);
  } else {
    comp.rerender();
  }
  return comp;
}

function _ComponentTests(debug) {

QUnit.module('ui/Component'+(debug?'(debug)':''), {
  beforeEach: function() {
    _withSpiesEnabled = false;
    RenderingEngine.DEBUG = debug;
  }
});

QUnit.test("Throw error when render method is not returning an element", function(assert) {
  var MyComponent = TestComponent.extend({
    render: function() {}
  });
  assert.throws(function() {
    MyComponent.static.render();
  }, "Should throw an exception when render does not return an element");
});

function SimpleComponent() {
  SimpleComponent.super.apply(this, arguments);
}

SimpleComponent.Prototype = function() {
  this.render = function($$) {
    var el = $$('div').addClass('simple-component');
    if (this.props.children) {
      el.append(this.props.children);
    }
    return el;
  };
};

TestComponent.extend(SimpleComponent);

QUnit.uiTest("Mounting a component", function(assert) {
  enableSpies();
  // Mount to a detached element
  var el = window.document.createElement('div');
  var comp = Component.mount(SimpleComponent, el);
  assert.equal(comp.didMount.callCount, 0, "didMount must not be called when mounting to detached elements");
  // Mount to an existing DOM element
  comp = Component.mount(SimpleComponent, window.document.querySelector('#qunit-fixture'));
  assert.equal(comp.didMount.callCount, 1, "didMount should have been called");
});

QUnit.test("Render an HTML element", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div');
  });
  assert.equal(comp.tagName, 'div', 'Element should be a "div".');
  comp = renderTestComponent(function($$) {
    return $$('span');
  });
  assert.equal(comp.tagName, 'span', 'Element should be a "span".');
});

QUnit.test("Render an element with attributes", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').attr('data-id', 'foo');
  });
  assert.equal(comp.attr('data-id'), 'foo', 'Element should be have data-id="foo".');
});

QUnit.test("Render an element with css styles", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').css('width', '100px');
  });
  assert.equal(comp.css('width'), '100px', 'Element should have a css width of 100px.');
});

QUnit.test("Render an element with classes", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').addClass('test');
  });
  assert.ok(comp.hasClass('test'), 'Element should have class "test".');
});

QUnit.test("Render an element with value", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('input').attr('type', 'text').val('foo');
  });
  assert.equal(comp.val(), 'foo', 'Value should be set.');
});

QUnit.test("Render an element with plain text", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').text('foo');
  });
  assert.equal(comp.textContent, 'foo','textContent should be set.');
});

QUnit.test("Render an element with custom html", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').html('Hello <b>World</b>');
  });
  // ATTENTION: it is important to call find() on the element API
  // not on the Component API, as Component#find will only provide
  // elements which are Component instance.
  var b = comp.el.find('b');
  assert.isDefinedAndNotNull(b, 'Element should have rendered HTML as content.');
  assert.equal(b.textContent, 'World','Rendered element should have right content.');
});

QUnit.test("Rendering an element with HTML attributes etc.", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div')
      .addClass('foo')
      .attr('data-id', 'foo')
      .setProperty('type', 'foo');
  });
  assert.equal(comp.attr('data-id'), 'foo', 'Element should have data-id="foo".');
  assert.ok(comp.hasClass('foo'), 'Element should have class "foo".');
  assert.equal(comp.getProperty('type'), 'foo', 'Element should have type "foo".');
});

QUnit.test("Rendering an input element with value", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('input').attr('type', 'text').val('foo');
  });
  assert.equal(comp.val(), 'foo', 'Input field should have value "foo".');
});

QUnit.test("Render a component", function(assert) {
  var comp = SimpleComponent.static.render();
  assert.equal(comp.tagName.toLowerCase(), 'div', 'Element should be a "div".');
  assert.ok(comp.hasClass('simple-component'), 'Element should have class "simple-component".');
});

QUnit.test("Rerender on setProps()", function(assert) {
  enableSpies();
  var comp = SimpleComponent.static.render({ foo: 'bar '});
  comp.shouldRerender.reset();
  comp.render.reset();
  comp.setProps({ foo: 'baz' });
  assert.ok(comp.shouldRerender.callCount > 0, "Component should have been asked whether to rerender.");
  assert.ok(comp.render.callCount > 0, "Component should have been rerendered.");
});

QUnit.test("Rerendering triggers didUpdate()", function(assert) {
  var comp = SimpleComponent.static.render({ foo: 'bar '});
  spy(comp, 'didUpdate');
  comp.rerender();
  assert.ok(comp.didUpdate.callCount === 1, "didUpdate() should have been called once.");
});

QUnit.test("Setting props triggers willReceiveProps()", function(assert) {
  var comp = SimpleComponent.static.render({ foo: 'bar '});
  spy(comp, 'willReceiveProps');
  comp.setProps({ foo: 'baz' });
  assert.ok(comp.willReceiveProps.callCount === 1, "willReceiveProps() should have been called once.");
});

QUnit.test("Rerender on setState()", function(assert) {
  enableSpies();
  var comp = SimpleComponent.static.render();
  comp.shouldRerender.reset();
  comp.render.reset();
  comp.setState({ foo: 'baz' });
  assert.ok(comp.shouldRerender.callCount > 0, "Component should have been asked whether to rerender.");
  assert.ok(comp.render.callCount > 0, "Component should have been rerendered.");
});

QUnit.test("Setting state triggers willUpdateState()", function(assert) {
  var comp = SimpleComponent.static.render();
  spy(comp, 'willUpdateState');
  comp.setState({ foo: 'baz' });
  assert.ok(comp.willUpdateState.callCount === 1, "willUpdateState() should have been called once.");
});

QUnit.test("Trigger didUpdate() when state or props have changed even with shouldRerender() = false", function(assert) {
  function A() {
    A.super.apply(this, arguments);
    this.shouldRerender = function() {
      return false;
    };
    this.render = function($$) {
      return $$('div');
    };
  }
  Component.extend(A);
  var comp = A.static.render();
  spy(comp, 'didUpdate');
  // component will not rerender but still should trigger didUpdate()
  comp.setProps({foo: 'bar'});
  assert.ok(comp.didUpdate.callCount === 1, "comp.didUpdate() should have been called once.");
  comp.didUpdate.reset();
  comp.setState({foo: 'bar'});
  assert.ok(comp.didUpdate.callCount === 1, "comp.didUpdate() should have been called once.");
});

QUnit.test("Dependency-Injection", function(assert) {
  function Parent() {
    Parent.super.apply(this, arguments);
  }
  Parent.Prototype = function() {
    this.getChildContext = function() {
      var childContext = {};
      if (this.props.name) {
        childContext[this.props.name] = this.props.name;
      }
      return childContext;
    };
    this.render = function($$) {
      var el = $$('div');
      // direct child
      el.append($$(Child).ref('a'));
      // indirect child
      el.append($$('div').append(
        $$(Child).ref('b')
      ));
      // ingested grandchild
      var grandchild = $$(Child).ref('c');
      el.append(
        $$(Wrapper, {name:'bar'}).append(grandchild)
      );
      return el;
    };
  };
  Component.extend(Parent);

  function Child() {
    Child.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div');
    };
  }
  Component.extend(Child);

  function Wrapper() {
    Wrapper.super.apply(this, arguments);
  }
  Wrapper.Prototype = function() {
    this.getChildContext = Parent.prototype.getChildContext;
    this.render = function($$) {
      return $$('div').append(this.props.children);
    };
  };
  Component.extend(Wrapper);

  var comp = Parent.static.render({name: 'foo'});
  var a = comp.refs.a;
  var b = comp.refs.b;
  var c = comp.refs.c;
  assert.isDefinedAndNotNull(a.context.foo, "'a' should have a property 'foo' in its context");
  assert.isNullOrUndefined(a.context.bar, ".. but not 'bar'");
  assert.isDefinedAndNotNull(b.context.foo, "'b' should have a property 'foo' in its context");
  assert.isNullOrUndefined(b.context.bar, ".. but not 'bar'");
  assert.isDefinedAndNotNull(c.context.foo, "'c' should have a property 'foo' in its context");
  assert.isDefinedAndNotNull(c.context.bar, ".. and also 'bar'");
});

/* ##################### Rerendering ##########################*/

QUnit.test("Rerendering varying content", function(assert) {
  function TestComponent() {
    TestComponent.super.apply(this, arguments);
  }
  TestComponent.Prototype = function() {
    this.getInitialState = function() {
      return { mode: 0 };
    };
    this.render = function($$) {
      var el = $$('div');
      switch (this.state.mode) {
        case 0:
          el.append(
            "Foo",
            $$('br')
          );
          break;
        case 1:
          el.append(
            "Bar",
            $$('span'),
            "Baz",
            $$('br')
          );
          break;
      }
      return el;
    };
  };
  Component.extend(TestComponent);
  var comp = TestComponent.static.render();
  var childNodes = comp.el.getChildNodes();
  assert.equal(childNodes.length, 2, '# Component should have two children in mode 0');
  assert.ok(childNodes[0].isTextNode(), '__first should be a TextNode');
  assert.equal(childNodes[0].textContent, 'Foo', '____with proper text content');
  assert.equal(childNodes[1].tagName, 'br', '__and second should be a <br>');

  comp.setState({ mode: 1 });
  childNodes = comp.el.getChildNodes();
  assert.equal(childNodes.length, 4, '# Component should have 4 children in mode 1');
  assert.ok(childNodes[0].isTextNode(), '__first should be a TextNode');
  assert.equal(childNodes[0].textContent, 'Bar', '____with proper text content');
  assert.equal(childNodes[1].tagName, 'span', '__second should be <span>');
  assert.ok(childNodes[2].isTextNode(), '__third should be a TextNode');
  assert.equal(childNodes[2].textContent, 'Baz', '____with proper text content');
  assert.equal(childNodes[3].tagName, 'br', '__and last should be a <br>');
});

// events are not supported by cheerio
QUnit.uiTest("Rendering an element with click handler", function(assert) {

  function ClickableComponent() {
    ClickableComponent.super.apply(this, arguments);
    this.value = 0;
  }
  ClickableComponent.Prototype = function() {
    this.render = function($$) {
      var el = $$('a').append('Click me');
      if (this.props.method === 'instance') {
        el.on('click', this.onClick);
      } else if (this.props.method === 'anonymous') {
        el.on('click', function() {
          this.value += 10;
        });
      }
      return el;
    };
    this.onClick = function() {
      this.value += 1;
    };
  };
  Component.extend(ClickableComponent);

  // first render without a click handler
  var comp = ClickableComponent.static.render();

  comp.click();
  assert.equal(comp.value, 0, 'Handler should not have been triggered');

  comp.value = 0;
  comp.setProps({method: 'instance'});
  comp.click();
  assert.equal(comp.value, 1, 'Instance method should have been triggered');
  comp.rerender();
  comp.click();
  assert.equal(comp.value, 2, 'Rerendering should not add multiple listeners.');

  comp.value = 0;
  comp.setProps({method: 'anonymous'});
  comp.click();
  assert.equal(comp.value, 10, 'Anonymous handler should have been triggered');
  comp.rerender();
  comp.click();
  assert.equal(comp.value, 20, 'Rerendering should not add multiple listeners.');
});

QUnit.uiTest("Rendering an element with once-click handler", function(assert) {
  function ClickableComponent() {
    ClickableComponent.super.apply(this, arguments);
    this.clicks = 0;
  }
  ClickableComponent.Prototype = function() {
    this.render = function($$) {
      return $$('a').append('Click me')
        .on('click', this.onClick, this, { once: true });
    };
    this.onClick = function() {
      this.clicks += 1;
    };
  };
  Component.extend(ClickableComponent);

  var comp = ClickableComponent.static.render();
  comp.click();
  assert.equal(comp.clicks, 1, 'Handler should have been triggered');
  comp.click();
  assert.equal(comp.clicks, 1, 'Handler should not have been triggered again');
});

/* ##################### Nested Elements/Components ##########################*/

QUnit.test("Render children elements", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').addClass('parent')
      .append($$('div').addClass('child1'))
      .append($$('div').addClass('child2'));
  });
  assert.equal(comp.getChildCount(), 2, 'Component should have two children.');
  assert.ok(comp.hasClass('parent'), 'Element should have class "parent".');
  assert.ok(comp.getChildAt(0).hasClass('child1'), 'First child should have class "child1".');
  assert.ok(comp.getChildAt(1).hasClass('child2'), 'Second child should have class "child2".');
});

QUnit.test("Render children components", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      $$(SimpleComponent).addClass('a'),
      $$(SimpleComponent).addClass('b')
    );
  });
  assert.equal(comp.getChildCount(), 2, "Component should have two children");
  var first = comp.getChildAt(0);
  var second = comp.getChildAt(1);
  assert.ok(first instanceof SimpleComponent, 'First child should be a SimpleComponent');
  assert.ok(first.hasClass('a'), '.. and should have class "a".');
  assert.ok(second instanceof SimpleComponent, 'Second child should be a SimpleComponent');
  assert.ok(second.hasClass('b'), '.. and should have class "b".');
});

QUnit.test("Render grandchildren elements", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      $$('div').addClass('child').append(
        $$('div').addClass('a'),
        $$('div').addClass('b')
      )
    );
  });
  assert.equal(comp.getChildCount(), 1, "Component should have 1 child");
  var child = comp.getChildAt(0);
  assert.equal(child.getChildCount(), 2, ".. and two grandchildren");
  var first = child.getChildAt(0);
  var second = child.getChildAt(1);
  assert.ok(first.hasClass('a'), 'First should have class "a".');
  assert.ok(second.hasClass('b'), 'Second should have class "b".');
});


QUnit.test("Render nested elements passed via props", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      $$(SimpleComponent, {
        children: [
          $$('div').addClass('a'),
          $$('div').addClass('b')
        ]
      })
    );
  });
  assert.equal(comp.getChildCount(), 1, "Component should have 1 child");
  var child = comp.getChildAt(0);
  assert.equal(child.getChildCount(), 2, ".. and two grandchildren");
  var first = child.getChildAt(0);
  var second = child.getChildAt(1);
  assert.ok(first.hasClass('a'), 'First grandchild should have class "a".');
  assert.ok(second.hasClass('b'), 'Second grandchild should have class "b".');
});

// didMount is only called in browser
QUnit.uiTest("Call didMount once when mounted", function(assert) {
  enableSpies();

  function Child() {
    Child.super.apply(this, arguments);

    this.render = function($$) {
      if (this.props.loading) {
        return $$('div').append('Loading...');
      } else {
        return $$('div').append(
          $$(SimpleComponent).ref('child')
        );
      }
    };
  }
  TestComponent.extend(Child);

  function Parent() {
    Parent.super.apply(this, arguments);

    this.render = function($$) {
      return $$('div')
        .append($$(Child,{loading: true}).ref('child'));
    };

    this.didMount = function() {
      this.refs.child.setProps({ loading: false });
    };
  }
  TestComponent.extend(Parent);

  var comp = Component.mount(Parent, '#qunit-fixture');
  var childComp = comp.refs.child;
  var grandChildComp = childComp.refs.child;
  assert.equal(childComp.didMount.callCount, 1, "Child's didMount should have been called only once.");
  assert.equal(grandChildComp.didMount.callCount, 1, "Grandchild's didMount should have been called only once.");

  comp.empty();
  assert.equal(childComp.dispose.callCount, 1, "Child's dispose should have been called once.");
  assert.equal(grandChildComp.dispose.callCount, 1, "Grandchild's dispose should have been called once.");
});

QUnit.test('Propagating properties to nested components', function(assert) {
  function ItemComponent() {
    ItemComponent.super.apply(this, arguments);
  }
  ItemComponent.Prototype = function() {
    this.render = function($$) {
      return $$('div').append(this.props.name);
    };
  };
  TestComponent.extend(ItemComponent);
  function CompositeComponent() {
    CompositeComponent.super.apply(this, arguments);
  }
  CompositeComponent.Prototype = function() {
    this.render = function($$) {
      var el = $$('div').addClass('composite-component');
      for (var i = 0; i < this.props.items.length; i++) {
        var item = this.props.items[i];
        el.append($$(ItemComponent, item));
      }
      return el;
    };
  };
  TestComponent.extend(CompositeComponent);

  var comp = CompositeComponent.static.render({
    items: [ {name: 'A'}, {name: 'B'} ]
  });
  assert.equal(comp.getChildCount(), 2, 'Component should have two children.');
  assert.equal(comp.getChildAt(0).textContent, 'A', 'First child should have text A');
  assert.equal(comp.getChildAt(1).textContent, 'B', 'First child should have text B');

  // Now we are gonna set new props
  comp.setProps({
    items: [ {name: 'X'}, {name: 'Y'} ]
  });
  assert.equal(comp.getChildCount(), 2, 'Component should have two children.');
  assert.equal(comp.getChildAt(0).textContent, 'X', 'First child should have text X');
  assert.equal(comp.getChildAt(1).textContent, 'Y', 'First child should have text Y');
});

QUnit.test("Updating HTML attributes in nested components", function(assert) {
  function Child() {
    Child.super.apply(this, arguments);

    this.render = function($$) {
      return $$('input').attr('type', 'text');
    };
  }
  TestComponent.extend(Child);

  function Parent() {
    Parent.super.apply(this, arguments);

    this.render = function($$) {
      var el = $$('div');
      var child = $$(Child).ref('child');
      if (this.props.childAttr) {
        child.attr(this.props.childAttr);
      }
      if (this.props.childClass) {
        child.addClass(this.props.childClass);
      }
      if (this.props.childCss) {
        child.css(this.props.childCss);
      }
      return el.append(child);
    };
  }
  TestComponent.extend(Parent);

  var comp = Parent.static.render();
  comp.setProps({ childAttr: { "data-id": "child" } });
  assert.equal(comp.refs.child.attr('data-id'), 'child', "Child component should have updated attribute.");
  comp.setProps({ childClass: "child" });
  assert.ok(comp.refs.child.hasClass('child'), "Child component should have updated class.");
  comp.setProps({ childCss: { "width": "50px" } });
  assert.equal(comp.refs.child.css('width'), "50px", "Child component should have updated css style.");
});

QUnit.test("Special nesting situation", function(assert) {
  // problem was observed in TOCPanel where components (tocEntry) are ingested via dependency-injection
  // and appended to a 'div' element (tocEntries) which then was ingested into a ScrollPane.
  // The order of _capturing must be determined correctly, i.e. first the ScrollPane needs to
  // be captured, so that the parent of the 'div' element (tocEntries) is known.
  // only then the tocEntry components can be captured.
  function Parent() {
    Parent.super.apply(this, arguments);

    this.render = function($$) {
      var el = $$('div');
      // grandchildren wrapped into a 'div' element
      var grandchildren = $$('div').append(
        $$(GrandChild, { name: 'foo' }).ref('foo'),
        $$(GrandChild, { name: 'bar' }).ref('bar')
      );
      el.append(
        // grandchildren wrapper ingested into Child component
        $$(Child).append(grandchildren)
      );
      return el;
    };
  }
  TestComponent.extend(Parent);

  function Child() {
    Child.super.apply(this, arguments);

    this.render = function($$) {
      return $$('div').append(this.props.children);
    };
  }
  TestComponent.extend(Child);

  function GrandChild() {
    GrandChild.super.apply(this, arguments);

    this.render = function($$) {
      return $$('div').append(this.props.name);
    };
  }
  TestComponent.extend(GrandChild);

  var comp = Parent.static.render();
  var foo = comp.refs.foo;
  var bar = comp.refs.bar;
  assert.isDefinedAndNotNull(foo, "Component should have a ref 'foo'.");
  assert.equal(foo.textContent, 'foo', "foo should have textContent 'foo'");
  assert.isDefinedAndNotNull(bar, "Component should have a ref 'bar'.");
  assert.equal(bar.textContent, 'bar', "bar should have textContent 'bar'");
});

QUnit.test("Special nesting situation II", function(assert) {
  function Parent() {
    Parent.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div').addClass('parent').append(
        $$(Child).append(
          $$('div').addClass('grandchild-container').append(
            $$(Grandchild).ref('grandchild')
          )
        ).ref('child')
      );
    };
  }
  Component.extend(Parent);
  function Child() {
    Child.super.apply(this, arguments);
    this.render = function($$) {
      var el = $$('div').addClass('child').append(
        this.props.children
      );
      return el;
    };
  }
  Component.extend(Child);
  function Grandchild() {
    Grandchild.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div').addClass('grandchild');
    };
  }
  Component.extend(Grandchild);
  var comp = Parent.static.render();
  var child = comp.refs.child;
  var grandchild = comp.refs.grandchild;
  assert.isDefinedAndNotNull(child, "Child should be referenced.");
  assert.isDefinedAndNotNull(grandchild, "Grandchild should be referenced.");
  comp.rerender();
  assert.ok(child === comp.refs.child, "Child should have been retained.");
  assert.ok(grandchild === comp.refs.grandchild, "Grandchild should have been retained.");
});

QUnit.test("Edge case: ingesting a child without picking up", function(assert) {
  function Parent() {
    Parent.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div').append(
        $$(Child).append('Foo')
      );
    };
  }
  Component.extend(Parent);
  function Child() {
    Child.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div');
    };
  }
  Component.extend(Child);
  var comp = Parent.static.render();
  assert.equal(comp.el.getChildCount(), 1, "Should have 1 child");
  assert.equal(comp.el.textContent, '', "textContent should be empty");
});

QUnit.test("Implicit retaining should not override higher-level rules", function(assert) {
  // If a child component has refs, itself should not be retained without
  // being ref'd by the parent
  function Parent() {
    Parent.super.apply(this, arguments);
    this.render = function($$) {
      // Child is not ref'd: this means the parent is not interested in keeping
      // this instance on rerender
      return $$('div').addClass('parent').append($$(Child));
    };
  }
  Component.extend(Parent);
  function Child() {
    Child.super.apply(this, arguments);
    this.render = function($$) {
      // 'foo' is ref'd, so it should be retained when rerendering on this level
      var el = $$('div').addClass('child').append(
        $$('div').addClass('foo').ref('foo')
      );
      return el;
    };
  }
  Component.extend(Child);
  var comp = Parent.static.render();
  var child = comp.find('.child');
  assert.isDefinedAndNotNull(child, "Child should exist.");
  var foo = child.refs.foo;
  child.rerender();
  assert.ok(child.refs.foo === foo, "'foo' should have been retained.");
  comp.rerender();
  var child2 = comp.find('.child');
  assert.ok(child !== child2, "Child should have been renewed.");
  assert.ok(foo !== child2.refs.foo, "'foo' should be different as well.");
});

QUnit.uiTest("Eventlisteners on child element", function(assert) {
  function Parent() {
    Parent.super.apply(this, arguments);
  }
  Parent.Prototype = function() {
    this.render = function($$) {
      return $$('div').append($$(Child).ref('child'));
    };
  };
  Component.extend(Parent);

  function Child() {
    Child.super.apply(this, arguments);
    this.clicks = 0;
  }
  Child.Prototype = function() {
    this.render = function($$) {
      return $$('a').append('Click me').on('click', this.onClick);
    };
    this.onClick = function() {
      this.clicks++;
    };
  };
  Component.extend(Child);

  var comp = Parent.static.render();
  var child = comp.refs.child;
  child.click();
  assert.equal(child.clicks, 1, 'Handler should have been triggered');
  comp.rerender();
  child.clicks = 0;
  child.click();
  assert.equal(child.clicks, 1, 'Handler should have been triggered');
});


/* ##################### Refs: Preserving Components ##########################*/

QUnit.test("Children without a ref are not retained", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      $$(SimpleComponent)
    );
  });
  var child = comp.getChildAt(0);
  comp.rerender();
  var newChild = comp.getChildAt(0);
  // as we did not apply a ref, the component should get rerendered from scratch
  assert.ok(newChild !== child, 'Child component should have been renewed.');
  assert.ok(newChild.el !== child.el, 'Child element should have been renewed.');
});

QUnit.test("Render a child element with ref", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').addClass('parent')
      .append($$('div').addClass('child').ref('foo'));
  });
  assert.isDefinedAndNotNull(comp.refs.foo, 'Component should have a ref "foo".');
  assert.ok(comp.refs.foo.hasClass('child'), 'Referenced component should have class "child".');
  // check that the instance is retained after rerender
  var child = comp.refs.foo;
  var el = child.getNativeElement();
  comp.rerender();
  assert.ok(comp.refs.foo === child, 'Child element should have been preserved.');
  assert.ok(comp.refs.foo.getNativeElement() === el, 'Native element should be the same.');
});

QUnit.test("Render a child component with ref", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      $$(SimpleComponent).ref('foo')
    );
  });
  var child = comp.refs.foo;
  var el = child.getNativeElement();
  comp.rerender();
  assert.ok(comp.refs.foo === child, 'Child component should have been preserved.');
  assert.ok(comp.refs.foo.getNativeElement() === el, 'Native element should be the same.');
});

QUnit.test("Rerendering a child component with ref triggers didUpdate()", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      $$(SimpleComponent).ref('foo')
    );
  });
  var child = comp.refs.foo;
  spy(child, 'didUpdate');
  comp.rerender();
  assert.ok(child.didUpdate.callCount === 1, "child.didUpdate() should have been called once.");
});

QUnit.test("Trigger didUpdate() on children even when shouldRerender()=false", function(assert) {
  function Child() {
    Child.super.apply(this, arguments);
  }
  Child.Prototype = function() {
    this.shouldRerender = function() {
      return false;
    };
  };
  Component.extend(Child);
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      // change prop randomly
      $$(Child, {foo: Date.now()}).ref('foo')
    );
  });
  var child = comp.refs.foo;
  spy(child, 'didUpdate');
  comp.rerender();
  assert.ok(child.didUpdate.callCount === 1, "child.didUpdate() should have been called once.");
});


QUnit.test("Refs on grandchild elements.", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      $$('div').append(
        $$('div').ref(this.props.grandChildRef)
      )
    );
  }, { grandChildRef: "foo"});

  assert.isDefinedAndNotNull(comp.refs.foo, "Ref 'foo' should be set.");
  var foo = comp.refs.foo;
  comp.rerender();
  assert.ok(foo === comp.refs.foo, "Referenced grandchild should have been retained.");
  spy(foo, 'dispose');
  comp.setProps({ grandChildRef: "bar" });
  assert.ok(foo.dispose.callCount > 0, "Former grandchild should have been disposed.");
  assert.isDefinedAndNotNull(comp.refs.bar, "Ref 'bar' should be set.");
  assert.ok(foo !== comp.refs.bar, "Grandchild should have been recreated.");
});

// it happened, that a grandchild component with ref was not preserved
QUnit.test("Ref on grandchild component.", function(assert) {
  function Grandchild() {
    Grandchild.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div').append(this.props.foo);
    };
  }
  TestComponent.extend(Grandchild);

  var comp = renderTestComponent(function($$) {
    var el = $$('div');
    el.append(
      $$('div').append(
        // generating a random property making sure the grandchild gets rerendered
        $$(Grandchild, { foo: ""+Date.now() }).ref('grandchild')
      )
    );
    return el;
  });
  assert.isDefinedAndNotNull(comp.refs.grandchild, "Ref 'grandchild' should be set.");
  var grandchild = comp.refs.grandchild;
  comp.rerender();
  assert.isDefinedAndNotNull(comp.refs.grandchild, "Ref 'grandchild' should be set.");
  assert.ok(comp.refs.grandchild === grandchild, "'grandchild' should be the same");
});

QUnit.test("Retain refs owned by parent but nested in child component.", function(assert) {
  // Note: the child component does not know that there is a ref
  // set by the parent. Still, the component should be retained on rerender
  function Child() {
    Child.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div').append(
        $$('div').append(this.props.children)
      );
    };
  }
  TestComponent.extend(Child);

  var comp = renderTestComponent(function($$) {
    var el = $$('div');
    el.append(
      $$('div').append(
        // generating a random property making sure the grandchild gets rerendered
        $$(Child).ref('child').append(
          $$('div').append('foo').ref('grandchild')
        )
      )
    );
    return el;
  });
  assert.isDefinedAndNotNull(comp.refs.grandchild, "Ref 'grandchild' should be set.");
  var grandchild = comp.refs.grandchild;
  comp.rerender();
  assert.ok(comp.refs.grandchild === grandchild, "'grandchild' should be the same");
});

QUnit.test("Should wipe a referenced component when class changes", function(assert) {
  function ComponentA() {
    ComponentA.super.apply(this, arguments);

    this.render = function($$) {
      return $$('div').addClass('component-a');
    };
  }
  TestComponent.extend(ComponentA);

  function ComponentB() {
    ComponentB.super.apply(this, arguments);

    this.render = function($$) {
      return $$('div').addClass('component-b');
    };
  }
  TestComponent.extend(ComponentB);

  function MainComponent() {
    MainComponent.super.apply(this, arguments);

    this.render = function($$) {
      var el = $$('div').addClass('context');
      var ComponentClass;
      if (this.props.context ==='A') {
        ComponentClass = ComponentA;
      } else {
        ComponentClass = ComponentB;
      }
      el.append($$(ComponentClass).ref('context'));
      return el;
    };
  }
  TestComponent.extend(MainComponent);

  var comp = MainComponent.static.render({context: 'A'});
  assert.ok(comp.refs.context instanceof ComponentA, 'Context should be of instance ComponentA');
  comp.setProps({context: 'B'});
  assert.ok(comp.refs.context instanceof ComponentB, 'Context should be of instance ComponentB');
});

QUnit.test('Should store refs always on owners', function(assert) {
  function MyComponent() {
    MyComponent.super.apply(this, arguments);

    this.render = function($$) {
      return $$('div').append(
        $$(SimpleComponent).append(
          $$('div').ref('helloComp')
        ).ref('simpleComp')
      );
    };
  }
  TestComponent.extend(MyComponent);

  var comp = MyComponent.static.render(MyComponent);
  assert.ok(comp.refs.helloComp, 'There should stil be a ref to the helloComp element/component');
});

QUnit.test("Implicitly retain elements when grandchild elements have refs.", function(assert) {
  var comp = renderTestComponent(function($$) {
    return $$('div').append(
      $$('div').append(
        $$('div').ref(this.props.grandChildRef)
      )
    );
  }, { grandChildRef: "foo"});

  var child = comp.getChildAt(0);
  comp.rerender();
  assert.ok(child === comp.getChildAt(0), "Child should be retained.");
  assert.ok(child.el === comp.getChildAt(0).el, "Child element should be retained.");
});

QUnit.test("Implicitly retain elements when passing grandchild with ref.", function(assert) {
  function Child() {
    Child.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div').append(
        $$('div').append(this.props.children)
      );
    };
  }
  TestComponent.extend(Child);

  var comp = renderTestComponent(function($$) {
    var grandchild = $$('div').ref('grandchild');
    return $$('div').append(
      $$('div').append(
        $$(Child).append(grandchild).ref('child')
      )
    );
  });

  var child = comp.getChildAt(0);
  comp.rerender();
  assert.ok(child === comp.getChildAt(0), "Child should be retained.");
  assert.ok(child.el === comp.getChildAt(0).el, "Child element should be retained.");
});

// In ScrollPane we provied a link into the Srollbar which accesses
// ScrollPanes ref in didUpdate()
// This is working fine when didUpdate() is called at the right time,
// i.e., when ScrollPane has been rendered already
QUnit.test("Everthing should be rendered when didUpdate() is triggered.", function(assert) {
  var parentIsUpdated = false;
  function Parent() {
    Parent.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div').append(
        $$(Child, {parent: this}).ref('child')
      );
    };
  }
  Component.extend(Parent);
  function Child() {
    Child.super.apply(this, arguments);
    this.render = function($$) {
      return $$('div');
    };
    this.didUpdate = function() {
      if (this.props.parent.el) {
        parentIsUpdated = true;
      }
    };
  }
  Component.extend(Child);

  var comp = Parent.static.render();
  // didUpdate() should not have been called (no rerender)
  assert.notOk(parentIsUpdated, 'Initially child.didUpdate() should not have been called.');
  comp.rerender();
  assert.ok(parentIsUpdated, 'After rerender child.didUpdate() should have access to parent.el');
});


/* ##################### Incremental Component API ##########################*/

QUnit.test("Component.append() should support appending text.", function(assert) {
  var comp = SimpleComponent.static.render();
  comp.append('XXX');
  assert.equal(comp.text(), 'XXX');
});

/* ##################### Integration tests / Issues ##########################*/

QUnit.test('Preserve components when ref matches, and rerender when props changed', function(assert) {
  enableSpies();

  function ItemComponent() {
    ItemComponent.super.apply(this, arguments);
  }
  ItemComponent.Prototype = function() {
    this.shouldRerender = function(nextProps) {
      return !isEqual(nextProps, this.props);
    };

    this.render = function($$) {
      return $$('div').append(this.props.name);
    };
  };
  TestComponent.extend(ItemComponent);

  function CompositeComponent() {
    CompositeComponent.super.apply(this, arguments);
  }
  CompositeComponent.Prototype = function() {
    this.render = function($$) {
      var el = $$('div').addClass('composite-component');
      this.props.items.forEach(function(item) {
        el.append($$(ItemComponent, item).ref(item.ref));
      });
      return el;
    };
  };
  TestComponent.extend(CompositeComponent);

  // Initial mount
  var comp = CompositeComponent.static.render({
    items: [
      {ref: 'a', name: 'A'},
      {ref: 'b', name: 'B'},
      {ref: 'c', name: 'C'}
    ]
  });

  var a = comp.refs.a;
  var b = comp.refs.b;
  var c = comp.refs.c;

  var childNodes = comp.childNodes;
  assert.equal(childNodes.length, 3, 'Component should have 3 children.');
  assert.equal(childNodes[0].textContent, 'A', '.. first child should have text A');
  assert.equal(childNodes[1].textContent, 'B', '.. second child should have text B');
  assert.equal(childNodes[2].textContent, 'C', '.. third child should have text C');

  comp.refs.a.render.reset();
  comp.refs.b.render.reset();

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

  childNodes = comp.childNodes;
  assert.equal(childNodes.length, 4, 'Component should now have 4 children.');
  // a and b should have been preserved
  assert.equal(a, comp.refs.a, '.. a should be the same instance');
  assert.equal(b, comp.refs.b, '.. b should be the same component instance');
  // c should be gone
  assert.equal(c.dispose.callCount, 1, '.. c should have been unmounted');
  // a should have been rerendered (different props) while b should not (same props)
  assert.ok(a.render.callCount > 0, '.. Component a should have been rerendered');
  assert.equal(b.render.callCount, 0, '.. Component b should not have been rerendered');
  // check content
  assert.equal(childNodes[0].textContent, 'X', '.. first child should have text X');
  assert.equal(childNodes[1].textContent, 'Y', '.. second child should have text Y');
  assert.equal(childNodes[2].textContent, 'B', '.. third child should have text Y');
  assert.equal(childNodes[3].textContent, 'Z', '.. fourth child should have text Z');
});

// Note: this is more of an integration test, but I did not manage to isolate the error
// maybe the solution gets us closer to what actually went wrong.
// TODO: try to split into useful smaller pieces.
QUnit.test("Unspecific integration test:  ref'd component must be retained", function(assert) {
  var ComponentWithRefs = Component.extend({
    getInitialState: function() {
      return {contextId: 'hello'};
    },
    render: function($$) {
      var el = $$('div').addClass('lc-lens lc-writer sc-controller');

      var workspace = $$('div').ref('workspace').addClass('le-workspace');

      workspace.append(
        // Main (left column)
        $$('div').ref('main').addClass("le-main").append(
          $$(SimpleComponent).ref('toolbar').append($$(SimpleComponent)),

          $$(SimpleComponent).ref('contentPanel').append(
            $$(SimpleComponent).ref('coverEditor'),

            // The full fledged document (ContainerEditor)
            $$("div").ref('content').addClass('document-content').append(
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

  var comp = ComponentWithRefs.static.render();
  assert.ok(comp.refs.contentPanel, 'There should be a ref to the contentPanel component');
  comp.setState({contextId: 'foo'});
  assert.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
  comp.setState({contextId: 'bar'});
  assert.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
  comp.setState({contextId: 'baz'});
  assert.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
});

QUnit.test("#312: refs should be bound to the owner, not to the parent.", function(assert) {
  function Child() {
    Child.super.apply(this, arguments);

    this.render = function($$) {
      return $$('div').append(this.props.children);
    };
  }
  TestComponent.extend(Child);

  function Parent() {
    Parent.super.apply(this, arguments);

    this.render = function($$) {
      var el = $$('div');
      el.append(
        $$(Child).append(
          $$('div').ref('foo').append('foo')
        )
      );
      return el;
    };
  }
  TestComponent.extend(Parent);

  var comp = Parent.static.render();
  assert.isDefinedAndNotNull(comp.refs.foo, 'Ref should be bound to owner.');
  assert.equal(comp.refs.foo.text(), 'foo', 'Ref should point to the right component.');
});

}

// with RenderingEngine in debug mode
_ComponentTests(true);
// and without
_ComponentTests(false);
