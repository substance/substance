"use strict";
/* eslint-disable no-invalid-this, indent */

var test = require('../test').module('ui/Component');

var spy = require('../spy');
var isEqual = require('lodash/isEqual');
var isNull = require('lodash/isNull');
var isUndefined = require('lodash/isUndefined');

var Component = require('../../ui/Component');
var RenderingEngine = require('../../ui/RenderingEngine');

var _withSpiesEnabled = false;

function isNullOrUndefined(t, x, msg) {
  return t.ok(isNull(x) || isUndefined(x), msg);
}

function isDefinedAndNotNull(t, x, msg) {
  return t.ok(!isNull(x) && !isUndefined(x), msg);
}

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

  // function ModuleSetup() {
  //   _withSpiesEnabled = false;
  //   RenderingEngine.DEBUG = debug;
  // }

  test("Throw error when render method is not returning an element", function(t) {
    var MyComponent = TestComponent.extend({
      render: function() {}
    });
    t.throws(function() {
      MyComponent.static.render();
    }, "Should throw an exception when render does not return an element");
    t.end();
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

  test.UI("Mounting a component", function(t) {
    enableSpies();
    // Mount to a detached element
    var el = window.document.createElement('div');
    var comp = Component.mount(SimpleComponent, el);
    t.equal(comp.didMount.callCount, 0, "didMount must not be called when mounting to detached elements");
    // Mount to an existing DOM element
    comp = Component.mount(SimpleComponent, window.document.querySelector('#qunit-fixture'));
    t.equal(comp.didMount.callCount, 1, "didMount should have been called");
    t.end();
  });

  test("Render an HTML element", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div');
    });
    t.equal(comp.tagName, 'div', 'Element should be a "div".');
    comp = renderTestComponent(function($$) {
      return $$('span');
    });
    t.equal(comp.tagName, 'span', 'Element should be a "span".');
    t.end();
  });

  test("Render an element with attributes", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').attr('data-id', 'foo');
    });
    t.equal(comp.attr('data-id'), 'foo', 'Element should be have data-id="foo".');
    t.end();
  });

  test("Render an element with css styles", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').css('width', '100px');
    });
    t.equal(comp.css('width'), '100px', 'Element should have a css width of 100px.');
    t.end();
  });

  test("Render an element with classes", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').addClass('test');
    });
    t.ok(comp.hasClass('test'), 'Element should have class "test".');
    t.end();
  });

  test("Render an element with value", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('input').attr('type', 'text').val('foo');
    });
    t.equal(comp.val(), 'foo', 'Value should be set.');
    t.end();
  });

  test("Render an element with plain text", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').text('foo');
    });
    t.equal(comp.textContent, 'foo','textContent should be set.');
    t.end();
  });

  test("Render an element with custom html", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').html('Hello <b>World</b>');
    });
    // ATTENTION: it is important to call find() on the element API
    // not on the Component API, as Component#find will only provide
    // elements which are Component instance.
    var b = comp.el.find('b');
    isDefinedAndNotNull(t, b, 'Element should have rendered HTML as content.');
    t.equal(b.textContent, 'World','Rendered element should have right content.');
    t.end();
  });

  test("Rendering an element with HTML attributes etc.", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div')
        .addClass('foo')
        .attr('data-id', 'foo')
        .htmlProp('type', 'foo');
    });
    t.equal(comp.attr('data-id'), 'foo', 'Element should have data-id="foo".');
    t.ok(comp.hasClass('foo'), 'Element should have class "foo".');
    t.equal(comp.htmlProp('type'), 'foo', 'Element should have type "foo".');
    t.end();
  });

  test("Rendering an input element with value", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('input').attr('type', 'text').val('foo');
    });
    t.equal(comp.val(), 'foo', 'Input field should have value "foo".');
    t.end();
  });

  test("Render a component", function(t) {
    var comp = SimpleComponent.static.render();
    t.equal(comp.tagName.toLowerCase(), 'div', 'Element should be a "div".');
    t.ok(comp.hasClass('simple-component'), 'Element should have class "simple-component".');
    t.end();
  });

  test("Rerender on setProps()", function(t) {
    enableSpies();
    var comp = SimpleComponent.static.render({ foo: 'bar '});
    comp.shouldRerender.reset();
    comp.render.reset();
    comp.setProps({ foo: 'baz' });
    t.ok(comp.shouldRerender.callCount > 0, "Component should have been asked whether to rerender.");
    t.ok(comp.render.callCount > 0, "Component should have been rerendered.");
    t.end();
  });

  test("Rerendering triggers didUpdate()", function(t) {
    var comp = SimpleComponent.static.render({ foo: 'bar '});
    spy(comp, 'didUpdate');
    comp.rerender();
    t.ok(comp.didUpdate.callCount === 1, "didUpdate() should have been called once.");
    t.end();
  });

  test("Setting props triggers willReceiveProps()", function(t) {
    var comp = SimpleComponent.static.render({ foo: 'bar '});
    spy(comp, 'willReceiveProps');
    comp.setProps({ foo: 'baz' });
    t.ok(comp.willReceiveProps.callCount === 1, "willReceiveProps() should have been called once.");
    t.end();
  });

  test("Rerender on setState()", function(t) {
    enableSpies();
    var comp = SimpleComponent.static.render();
    comp.shouldRerender.reset();
    comp.render.reset();
    comp.setState({ foo: 'baz' });
    t.ok(comp.shouldRerender.callCount > 0, "Component should have been asked whether to rerender.");
    t.ok(comp.render.callCount > 0, "Component should have been rerendered.");
    t.end();
  });

  test("Setting state triggers willUpdateState()", function(t) {
    var comp = SimpleComponent.static.render();
    spy(comp, 'willUpdateState');
    comp.setState({ foo: 'baz' });
    t.ok(comp.willUpdateState.callCount === 1, "willUpdateState() should have been called once.");
    t.end();
  });

  test("Trigger didUpdate() when state or props have changed even with shouldRerender() = false", function(t) {
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
    t.ok(comp.didUpdate.callCount === 1, "comp.didUpdate() should have been called once.");
    comp.didUpdate.reset();
    comp.setState({foo: 'bar'});
    t.ok(comp.didUpdate.callCount === 1, "comp.didUpdate() should have been called once.");
    t.end();
  });

  test("Dependency-Injection", function(t) {
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
    isDefinedAndNotNull(t, a.context.foo, "'a' should have a property 'foo' in its context");
    isNullOrUndefined(t, a.context.bar, ".. but not 'bar'");
    isDefinedAndNotNull(t, b.context.foo, "'b' should have a property 'foo' in its context");
    isNullOrUndefined(t, b.context.bar, ".. but not 'bar'");
    isDefinedAndNotNull(t, c.context.foo, "'c' should have a property 'foo' in its context");
    isDefinedAndNotNull(t, c.context.bar, ".. and also 'bar'");
    t.end();
  });

  /* ##################### Rerendering ##########################*/

  test("Rerendering varying content", function(t) {
    function TestComponent() {
      TestComponent.super.apply(this, arguments);
    }
    TestComponent.Prototype = function() {
      this.getInitialState = function() {
        return { mode: 0 };
      };
      this.render = function($$) {
        var el = $$('div');
        if (this.state.mode === 0) {
          el.append(
            "Foo",
            $$('br')
          );
        } else {
          el.append(
            "Bar",
            $$('span'),
            "Baz",
            $$('br')
          );
        }
        return el;
      };
    };
    Component.extend(TestComponent);
    var comp = TestComponent.static.render();
    var childNodes = comp.el.getChildNodes();
    t.equal(childNodes.length, 2, '# Component should have two children in mode 0');
    t.ok(childNodes[0].isTextNode(), '__first should be a TextNode');
    t.equal(childNodes[0].textContent, 'Foo', '____with proper text content');
    t.equal(childNodes[1].tagName, 'br', '__and second should be a <br>');

    comp.setState({ mode: 1 });
    childNodes = comp.el.getChildNodes();
    t.equal(childNodes.length, 4, '# Component should have 4 children in mode 1');
    t.ok(childNodes[0].isTextNode(), '__first should be a TextNode');
    t.equal(childNodes[0].textContent, 'Bar', '____with proper text content');
    t.equal(childNodes[1].tagName, 'span', '__second should be <span>');
    t.ok(childNodes[2].isTextNode(), '__third should be a TextNode');
    t.equal(childNodes[2].textContent, 'Baz', '____with proper text content');
    t.equal(childNodes[3].tagName, 'br', '__and last should be a <br>');
    t.end();
  });

  // events are not supported by cheerio
  test.UI("Rendering an element with click handler", function(t) {

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
    t.equal(comp.value, 0, 'Handler should not have been triggered');

    comp.value = 0;
    comp.setProps({method: 'instance'});
    comp.click();
    t.equal(comp.value, 1, 'Instance method should have been triggered');
    comp.rerender();
    comp.click();
    t.equal(comp.value, 2, 'Rerendering should not add multiple listeners.');

    comp.value = 0;
    comp.setProps({method: 'anonymous'});
    comp.click();
    t.equal(comp.value, 10, 'Anonymous handler should have been triggered');
    comp.rerender();
    comp.click();
    t.equal(comp.value, 20, 'Rerendering should not add multiple listeners.');
    t.end();
  });

  test.UI("Rendering an element with once-click handler", function(t) {
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
    t.equal(comp.clicks, 1, 'Handler should have been triggered');
    comp.click();
    t.equal(comp.clicks, 1, 'Handler should not have been triggered again');
    t.end();
  });

  /* ##################### Nested Elements/Components ##########################*/

  test("Render children elements", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').addClass('parent')
        .append($$('div').addClass('child1'))
        .append($$('div').addClass('child2'));
    });
    t.equal(comp.getChildCount(), 2, 'Component should have two children.');
    t.ok(comp.hasClass('parent'), 'Element should have class "parent".');
    t.ok(comp.getChildAt(0).hasClass('child1'), 'First child should have class "child1".');
    t.ok(comp.getChildAt(1).hasClass('child2'), 'Second child should have class "child2".');
    t.end();
  });

  test("Render children components", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').append(
        $$(SimpleComponent).addClass('a'),
        $$(SimpleComponent).addClass('b')
      );
    });
    t.equal(comp.getChildCount(), 2, "Component should have two children");
    var first = comp.getChildAt(0);
    var second = comp.getChildAt(1);
    t.ok(first instanceof SimpleComponent, 'First child should be a SimpleComponent');
    t.ok(first.hasClass('a'), '.. and should have class "a".');
    t.ok(second instanceof SimpleComponent, 'Second child should be a SimpleComponent');
    t.ok(second.hasClass('b'), '.. and should have class "b".');
    t.end();
  });

  test("Render grandchildren elements", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').append(
        $$('div').addClass('child').append(
          $$('div').addClass('a'),
          $$('div').addClass('b')
        )
      );
    });
    t.equal(comp.getChildCount(), 1, "Component should have 1 child");
    var child = comp.getChildAt(0);
    t.equal(child.getChildCount(), 2, ".. and two grandchildren");
    var first = child.getChildAt(0);
    var second = child.getChildAt(1);
    t.ok(first.hasClass('a'), 'First should have class "a".');
    t.ok(second.hasClass('b'), 'Second should have class "b".');
    t.end();
  });


  test("Render nested elements passed via props", function(t) {
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
    t.equal(comp.getChildCount(), 1, "Component should have 1 child");
    var child = comp.getChildAt(0);
    t.equal(child.getChildCount(), 2, ".. and two grandchildren");
    var first = child.getChildAt(0);
    var second = child.getChildAt(1);
    t.ok(first.hasClass('a'), 'First grandchild should have class "a".');
    t.ok(second.hasClass('b'), 'Second grandchild should have class "b".');
    t.end();
  });

  // didMount is only called in browser
  test.UI("Call didMount once when mounted", function(t) {
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
    t.equal(childComp.didMount.callCount, 1, "Child's didMount should have been called only once.");
    t.equal(grandChildComp.didMount.callCount, 1, "Grandchild's didMount should have been called only once.");

    comp.empty();
    t.equal(childComp.dispose.callCount, 1, "Child's dispose should have been called once.");
    t.equal(grandChildComp.dispose.callCount, 1, "Grandchild's dispose should have been called once.");
    t.end();
  });

  test('Propagating properties to nested components', function(t) {
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
    t.equal(comp.getChildCount(), 2, 'Component should have two children.');
    t.equal(comp.getChildAt(0).textContent, 'A', 'First child should have text A');
    t.equal(comp.getChildAt(1).textContent, 'B', 'First child should have text B');

    // Now we are gonna set new props
    comp.setProps({
      items: [ {name: 'X'}, {name: 'Y'} ]
    });
    t.equal(comp.getChildCount(), 2, 'Component should have two children.');
    t.equal(comp.getChildAt(0).textContent, 'X', 'First child should have text X');
    t.equal(comp.getChildAt(1).textContent, 'Y', 'First child should have text Y');
    t.end();
  });

  test("Updating HTML attributes in nested components", function(t) {
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
    t.equal(comp.refs.child.attr('data-id'), 'child', "Child component should have updated attribute.");
    comp.setProps({ childClass: "child" });
    t.ok(comp.refs.child.hasClass('child'), "Child component should have updated class.");
    comp.setProps({ childCss: { "width": "50px" } });
    t.equal(comp.refs.child.css('width'), "50px", "Child component should have updated css style.");
    t.end();
  });

  test("Special nesting situation", function(t) {
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
    isDefinedAndNotNull(t, foo, "Component should have a ref 'foo'.");
    t.equal(foo.textContent, 'foo', "foo should have textContent 'foo'");
    isDefinedAndNotNull(t, bar, "Component should have a ref 'bar'.");
    t.equal(bar.textContent, 'bar', "bar should have textContent 'bar'");
    t.end();
  });

  test("Special nesting situation II", function(t) {
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
    isDefinedAndNotNull(t, child, "Child should be referenced.");
    isDefinedAndNotNull(t, grandchild, "Grandchild should be referenced.");
    comp.rerender();
    t.ok(child === comp.refs.child, "Child should have been retained.");
    t.ok(grandchild === comp.refs.grandchild, "Grandchild should have been retained.");
    t.end();
  });

  test("Implicit retaining in 3-level nesting situation", function(t) {
    function Parent() {
      Parent.super.apply(this, arguments);
      this.render = function($$) {
        return $$('div').addClass('parent').append(
          // this element should be retained implicitly because Grandchild has a ref
          // The challenge is to find out that wrapper and Child need to be retained,
          // because of the ref on Grandchild
          // At the time of descent, nothing can be told about the content of Child
          // as it depends on Child.render() how grandchild is treated actually
          $$('div').addClass('wrapper').append(
            $$(Child).append(
              $$(Grandchild).ref('grandchild')
            )
          )
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
    var wrapper = comp.find('.wrapper');
    comp.rerender();
    var wrapper2 = comp.find('.wrapper');
    t.ok(wrapper.el === wrapper2.el, "wrapper element should have been retained.");
    t.end();
  });

  test("Edge case: ingesting a child without picking up", function(t) {
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
    t.equal(comp.el.getChildCount(), 1, "Should have 1 child");
    t.equal(comp.el.textContent, '', "textContent should be empty");
    t.end();
  });

  test("Implicit retaining should not override higher-level rules", function(t) {
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
    isDefinedAndNotNull(t, child, "Child should exist.");
    var foo = child.refs.foo;
    child.rerender();
    t.ok(child.refs.foo === foo, "'foo' should have been retained.");
    comp.rerender();
    var child2 = comp.find('.child');
    t.ok(child !== child2, "Child should have been renewed.");
    t.ok(foo !== child2.refs.foo, "'foo' should be different as well.");
    t.end();
  });

  test.UI("Eventlisteners on child element", function(t) {
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
    t.equal(child.clicks, 1, 'Handler should have been triggered');
    comp.rerender();
    child.clicks = 0;
    child.click();
    t.equal(child.clicks, 1, 'Handler should have been triggered');
    t.end();
  });


  /* ##################### Refs: Preserving Components ##########################*/

  test("Children without a ref are not retained", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').append(
        $$(SimpleComponent)
      );
    });
    var child = comp.getChildAt(0);
    comp.rerender();
    var newChild = comp.getChildAt(0);
    // as we did not apply a ref, the component should get rerendered from scratch
    t.ok(newChild !== child, 'Child component should have been renewed.');
    t.ok(newChild.el !== child.el, 'Child element should have been renewed.');
    t.end();
  });

  test("Render a child element with ref", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').addClass('parent')
        .append($$('div').addClass('child').ref('foo'));
    });
    isDefinedAndNotNull(t, comp.refs.foo, 'Component should have a ref "foo".');
    t.ok(comp.refs.foo.hasClass('child'), 'Referenced component should have class "child".');
    // check that the instance is retained after rerender
    var child = comp.refs.foo;
    var el = child.getNativeElement();
    comp.rerender();
    t.ok(comp.refs.foo === child, 'Child element should have been preserved.');
    t.ok(comp.refs.foo.getNativeElement() === el, 'Native element should be the same.');
    t.end();
  });

  test("Render a child component with ref", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').append(
        $$(SimpleComponent).ref('foo')
      );
    });
    var child = comp.refs.foo;
    var el = child.getNativeElement();
    comp.rerender();
    t.ok(comp.refs.foo === child, 'Child component should have been preserved.');
    t.ok(comp.refs.foo.getNativeElement() === el, 'Native element should be the same.');
    t.end();
  });

  test("Rerendering a child component with ref triggers didUpdate()", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').append(
        $$(SimpleComponent).ref('foo')
      );
    });
    var child = comp.refs.foo;
    spy(child, 'didUpdate');
    comp.rerender();
    t.ok(child.didUpdate.callCount === 1, "child.didUpdate() should have been called once.");
    t.end();
  });

  test("Trigger didUpdate() on children even when shouldRerender()=false", function(t) {
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
    t.ok(child.didUpdate.callCount === 1, "child.didUpdate() should have been called once.");
    t.end();
  });


  test("Refs on grandchild elements.", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').append(
        $$('div').append(
          $$('div').ref(this.props.grandChildRef)
        )
      );
    }, { grandChildRef: "foo"});

    isDefinedAndNotNull(t, comp.refs.foo, "Ref 'foo' should be set.");
    var foo = comp.refs.foo;
    comp.rerender();
    t.ok(foo === comp.refs.foo, "Referenced grandchild should have been retained.");
    spy(foo, 'dispose');
    comp.setProps({ grandChildRef: "bar" });
    t.ok(foo.dispose.callCount > 0, "Former grandchild should have been disposed.");
    isDefinedAndNotNull(t, comp.refs.bar, "Ref 'bar' should be set.");
    t.ok(foo !== comp.refs.bar, "Grandchild should have been recreated.");
    t.end();
  });

  // it happened, that a grandchild component with ref was not preserved
  test("Ref on grandchild component.", function(t) {
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
          $$(Grandchild, { foo: String(Date.now()) }).ref('grandchild')
        )
      );
      return el;
    });
    isDefinedAndNotNull(t, comp.refs.grandchild, "Ref 'grandchild' should be set.");
    var grandchild = comp.refs.grandchild;
    comp.rerender();
    isDefinedAndNotNull(t, comp.refs.grandchild, "Ref 'grandchild' should be set.");
    t.ok(comp.refs.grandchild === grandchild, "'grandchild' should be the same");
    t.end();
  });

  test("Retain refs owned by parent but nested in child component.", function(t) {
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
    isDefinedAndNotNull(t, comp.refs.grandchild, "Ref 'grandchild' should be set.");
    var grandchild = comp.refs.grandchild;
    comp.rerender();
    t.ok(comp.refs.grandchild === grandchild, "'grandchild' should be the same");
    t.end();
  });

  test("Should wipe a referenced component when class changes", function(t) {
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
    t.ok(comp.refs.context instanceof ComponentA, 'Context should be of instance ComponentA');
    comp.setProps({context: 'B'});
    t.ok(comp.refs.context instanceof ComponentB, 'Context should be of instance ComponentB');
    t.end();
  });

  test('Should store refs always on owners', function(t) {
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
    t.ok(comp.refs.helloComp, 'There should stil be a ref to the helloComp element/component');
    t.end();
  });

  test("Implicitly retain elements when grandchild elements have refs.", function(t) {
    var comp = renderTestComponent(function($$) {
      return $$('div').append(
        $$('div').append(
          $$('div').ref(this.props.grandChildRef)
        )
      );
    }, { grandChildRef: "foo"});

    var child = comp.getChildAt(0);
    comp.rerender();
    t.ok(child === comp.getChildAt(0), "Child should be retained.");
    t.ok(child.el === comp.getChildAt(0).el, "Child element should be retained.");
    t.end();
  });

  test("Implicitly retain elements when passing grandchild with ref.", function(t) {
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
        $$(Child).append(grandchild)
      );
    });

    var child = comp.getChildAt(0);
    comp.rerender();
    t.ok(child === comp.getChildAt(0), "Child should be retained.");
    t.ok(child.el === comp.getChildAt(0).el, "Child element should be retained.");
    t.end();
  });

  // In ScrollPane we provied a link into the Srollbar which accesses
  // ScrollPanes ref in didUpdate()
  // This is working fine when didUpdate() is called at the right time,
  // i.e., when ScrollPane has been rendered already
  test("Everthing should be rendered when didUpdate() is triggered.", function(t) {
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
    t.notOk(parentIsUpdated, 'Initially child.didUpdate() should not have been called.');
    comp.rerender();
    t.ok(parentIsUpdated, 'After rerender child.didUpdate() should have access to parent.el');
    t.end();
  });


  /* ##################### Incremental Component API ##########################*/

  test("Component.append() should support appending text.", function(t) {
    var comp = SimpleComponent.static.render();
    comp.append('XXX');
    t.equal(comp.text(), 'XXX');
    t.end();
  });

  /* ##################### Integration tests / Issues ##########################*/

  test('Preserve components when ref matches, and rerender when props changed', function(t) {
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
    t.equal(childNodes.length, 3, 'Component should have 3 children.');
    t.equal(childNodes[0].textContent, 'A', '.. first child should have text A');
    t.equal(childNodes[1].textContent, 'B', '.. second child should have text B');
    t.equal(childNodes[2].textContent, 'C', '.. third child should have text C');

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
    t.equal(childNodes.length, 4, 'Component should now have 4 children.');
    // a and b should have been preserved
    t.equal(a, comp.refs.a, '.. a should be the same instance');
    t.equal(b, comp.refs.b, '.. b should be the same component instance');
    // c should be gone
    t.equal(c.dispose.callCount, 1, '.. c should have been unmounted');
    // a should have been rerendered (different props) while b should not (same props)
    t.ok(a.render.callCount > 0, '.. Component a should have been rerendered');
    t.equal(b.render.callCount, 0, '.. Component b should not have been rerendered');
    // check content
    t.equal(childNodes[0].textContent, 'X', '.. first child should have text X');
    t.equal(childNodes[1].textContent, 'Y', '.. second child should have text Y');
    t.equal(childNodes[2].textContent, 'B', '.. third child should have text Y');
    t.equal(childNodes[3].textContent, 'Z', '.. fourth child should have text Z');
    t.end();
  });

  // Note: this is more of an integration test, but I did not manage to isolate the error
  // maybe the solution gets us closer to what actually went wrong.
  // TODO: try to split into useful smaller pieces.
  test("Unspecific integration test:  ref'd component must be retained", function(t) {
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
    t.ok(comp.refs.contentPanel, 'There should be a ref to the contentPanel component');
    comp.setState({contextId: 'foo'});
    t.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
    comp.setState({contextId: 'bar'});
    t.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
    comp.setState({contextId: 'baz'});
    t.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component');
    t.end();
  });

  test("#312: refs should be bound to the owner, not to the parent.", function(t) {
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
    isDefinedAndNotNull(t, comp.refs.foo, 'Ref should be bound to owner.');
    t.equal(comp.refs.foo.text(), 'foo', 'Ref should point to the right component.');
    t.end();
  });

}

// with RenderingEngine in debug mode
_ComponentTests(true);
// and without
_ComponentTests(false);
