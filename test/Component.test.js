import { module, spy } from 'substance-test'
import substanceGlobals from '../util/substanceGlobals'
import isEqual from '../util/isEqual'
import inBrowser from '../util/inBrowser'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import Component from '../ui/Component'
import TestComponent from './fixture/TestComponent'

const Simple = TestComponent.Simple

// regular rendering using default DOM elements
ComponentTests()

// RenderingEngine in debug mode
ComponentTests('debug')

// in the browser do an extra run on memory DOM elements
if (inBrowser) {
  ComponentTests(false, 'memory')
}

function ComponentTests(debug, memory) {

  const test = module('Component' + (debug ? ' [debug]' : '') + (memory ? ' [memory]' : ''), {
    before: function(t) {
      substanceGlobals.DEBUG_RENDERING = Boolean(debug)
      if (memory) DefaultDOMElement._useXNode()
      t._document = DefaultDOMElement.createDocument('html')
    },
    after: function() {
      DefaultDOMElement._reset()
    }
  })

  test("Throw error when render method is not returning an element", function(t) {
    class MyComponent extends TestComponent {
      render() {}
    }
    t.throws(function() {
      MyComponent.render()
    }, "Should throw an exception when render does not return an element")
    t.end()
  })

  test("Mounting a component", function(t) {
    // Mounting a detached element
    let doc = t._document.createDocument('html')
    let el = doc.createElement('div')
    let comp = Simple.mount(el)
    t.equal(comp.didMount.callCount, 0, "didMount must not be called when mounting to detached elements")
    // Mounting an attached element
    comp = Simple.mount(doc.firstChild)
    t.equal(comp.didMount.callCount, 1, "didMount should have been called")
    t.end()
  })

  test("Render an HTML element", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div')
    })
    t.equal(comp.el.tagName, 'div', 'Element should be a "div".')
    comp = TestComponent.create(function($$) {
      return $$('span')
    })
    t.equal(comp.el.tagName, 'span', 'Element should be a "span".')
    t.end()
  })

  test("Render an element with attributes", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').attr('data-id', 'foo')
    })
    t.equal(comp.el.attr('data-id'), 'foo', 'Element should be have data-id="foo".')
    t.end()
  })

  test("Render an element with css styles", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').css('width', '100px')
    })
    t.equal(comp.el.css('width'), '100px', 'Element should have a css width of 100px.')
    t.end()
  })

  test("Render an element with classes", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').addClass('test')
    })
    t.ok(comp.el.hasClass('test'), 'Element should have class "test".')
    t.end()
  })

  test("Render an element with value", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('input').attr('type', 'text').val('foo')
    })
    t.equal(comp.el.val(), 'foo', 'Value should be set.')
    t.end()
  })

  test("Render an element with plain text", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').text('foo')
    })
    t.equal(comp.el.textContent, 'foo','textContent should be set.')
    t.end()
  })

  test("Render an element with custom html", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').html('Hello <b>World</b>')
    })
    // ATTENTION: it is important to call find() on the element API
    // not on the Component API, as Component#find will only provide
    // elements which are Component instance.
    let b = comp.el.find('b')
    t.notNil(b, 'Element should have rendered HTML as content.')
    t.equal(b.textContent, 'World','Rendered element should have right content.')
    t.end()
  })

  test("Rendering an element with HTML attributes etc.", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div')
        .addClass('foo')
        .attr('data-id', 'foo')
        .htmlProp('type', 'foo')
    })
    t.equal(comp.el.attr('data-id'), 'foo', 'Element should have data-id="foo".')
    t.ok(comp.el.hasClass('foo'), 'Element should have class "foo".')
    t.equal(comp.el.getProperty('type'), 'foo', 'Element should have type "foo".')
    t.end()
  })

  test("Rendering an input element with value", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('input').attr('type', 'text').val('foo')
    })
    t.equal(comp.el.val(), 'foo', 'Input field should have value "foo".')
    t.end()
  })

  test("Render a component", function(t) {
    let comp = Simple.render()
    t.equal(comp.el.tagName.toLowerCase(), 'div', 'Element should be a "div".')
    t.ok(comp.el.hasClass('simple-component'), 'Element should have class "simple-component".')
    t.end()
  })

  test("Rerender on setProps()", function(t) {
    let comp = Simple.render({ foo: 'bar '})
    comp.shouldRerender.reset()
    comp.render.reset()
    comp.setProps({ foo: 'baz' })
    t.ok(comp.shouldRerender.callCount > 0, "Component should have been asked whether to rerender.")
    t.ok(comp.render.callCount > 0, "Component should have been rerendered.")
    t.end()
  })

  test("Rerendering triggers didUpdate()", function(t) {
    let comp = Simple.render({ foo: 'bar '})
    spy(comp, 'didUpdate')
    comp.rerender()
    t.ok(comp.didUpdate.callCount === 1, "didUpdate() should have been called once.")
    t.end()
  })

  test("Setting props triggers willReceiveProps()", function(t) {
    let comp = Simple.render({ foo: 'bar '})
    spy(comp, 'willReceiveProps')
    comp.setProps({ foo: 'baz' })
    t.ok(comp.willReceiveProps.callCount === 1, "willReceiveProps() should have been called once.")
    t.end()
  })

  test("Rerender on setState()", function(t) {
    let comp = Simple.render()
    comp.shouldRerender.reset()
    comp.render.reset()
    comp.setState({ foo: 'baz' })
    t.ok(comp.shouldRerender.callCount > 0, "Component should have been asked whether to rerender.")
    t.ok(comp.render.callCount > 0, "Component should have been rerendered.")
    t.end()
  })

  test("Setting state triggers willUpdateState()", function(t) {
    let comp = Simple.render()
    spy(comp, 'willUpdateState')
    comp.setState({ foo: 'baz' })
    t.ok(comp.willUpdateState.callCount === 1, "willUpdateState() should have been called once.")
    t.end()
  })

  test("Trigger didUpdate() when state or props have changed even with shouldRerender() = false", function(t) {
    class A extends Component {
      shouldRerender() {
        return false
      }
      render($$) {
        return $$('div')
      }
    }
    let comp = A.render()
    spy(comp, 'didUpdate')
    // component will not rerender but still should trigger didUpdate()
    comp.setProps({foo: 'bar'})
    t.ok(comp.didUpdate.callCount === 1, "comp.didUpdate() should have been called once.")
    comp.didUpdate.reset()
    comp.setState({foo: 'bar'})
    t.ok(comp.didUpdate.callCount === 1, "comp.didUpdate() should have been called once.")
    t.end()
  })

  test("Dependency-Injection", function(t) {
    class Parent extends Component {
      getChildContext() {
        let childContext = {}
        if (this.props.name) {
          childContext[this.props.name] = this.props.name
        }
        return childContext
      }
      render($$) {
        let el = $$('div')
        // direct child
        el.append($$(Child).ref('a'))
        // indirect child
        el.append($$('div').append(
          $$(Child).ref('b')
        ))
        el.append(
          $$(Wrapper, {
            name:'bar',
            // ingested grandchild
            children: [
              $$(Child).ref('c')
            ]
          })
        )
        return el
      }
    }
    class Child extends Component {
      render($$) {
        return $$('div')
      }
    }
    class Wrapper extends Component {
      render($$) {
        return $$('div').append(this.props.children)
      }
    }

    Wrapper.prototype.getChildContext = Parent.prototype.getChildContext

    let comp = Parent.render({name: 'foo'})
    let a = comp.refs.a
    let b = comp.refs.b
    let c = comp.refs.c
    t.notNil(a.context.foo, "'a' should have a property 'foo' in its context")
    t.isNil(a.context.bar, ".. but not 'bar'")
    t.notNil(b.context.foo, "'b' should have a property 'foo' in its context")
    t.isNil(b.context.bar, ".. but not 'bar'")
    t.notNil(c.context.foo, "'c' should have a property 'foo' in its context")
    t.notNil(c.context.bar, ".. and also 'bar'")
    t.end()
  })

  /* ##################### Rerendering ##########################*/

  test("Rerendering varying content", function(t) {
    class TestComponent extends Component {
      getInitialState() {
        return { mode: 0 }
      }
      render($$) {
        let el = $$('div')
        if (this.state.mode === 0) {
          el.append(
            "Foo",
            $$('br')
          )
        } else {
          el.append(
            "Bar",
            $$('span'),
            "Baz",
            $$('br')
          )
        }
        return el
      }
    }
    let comp = TestComponent.render()
    let childNodes = comp.el.getChildNodes()
    t.equal(childNodes.length, 2, '# Component should have two children in mode 0')
    t.ok(childNodes[0].isTextNode(), '__first should be a TextNode')
    t.equal(childNodes[0].textContent, 'Foo', '____with proper text content')
    t.equal(childNodes[1].tagName, 'br', '__and second should be a <br>')

    comp.setState({ mode: 1 })
    childNodes = comp.el.getChildNodes()
    t.equal(childNodes.length, 4, '# Component should have 4 children in mode 1')
    t.ok(childNodes[0].isTextNode(), '__first should be a TextNode')
    t.equal(childNodes[0].textContent, 'Bar', '____with proper text content')
    t.equal(childNodes[1].tagName, 'span', '__second should be <span>')
    t.ok(childNodes[2].isTextNode(), '__third should be a TextNode')
    t.equal(childNodes[2].textContent, 'Baz', '____with proper text content')
    t.equal(childNodes[3].tagName, 'br', '__and last should be a <br>')
    t.end()
  })

  // events are not supported by cheerio
  test("Rendering an element with click handler", function(t) {

    class ClickableComponent extends Component {
      constructor(...args) {
        super(...args)
        this.value = 0
      }
      render($$) {
        let el = $$('a').append('Click me')
        if (this.props.method === 'instance') {
          el.on('click', this.onClick)
        } else if (this.props.method === 'anonymous') {
          el.on('click', () => {
            this.value += 10
          })
        }
        return el
      }
      onClick() {
        this.value += 1
      }
    }

    // first render without a click handler
    let comp = ClickableComponent.render()

    comp.click()
    t.equal(comp.value, 0, 'Handler should not have been triggered')

    comp.value = 0
    comp.setProps({method: 'instance'})
    comp.click()
    t.equal(comp.value, 1, 'Instance method should have been triggered')
    comp.rerender()
    comp.click()
    t.equal(comp.value, 2, 'Rerendering should not add multiple listeners.')

    comp.value = 0
    comp.setProps({method: 'anonymous'})
    comp.click()
    t.equal(comp.value, 10, 'Anonymous handler should have been triggered')
    comp.rerender()
    comp.click()
    t.equal(comp.value, 20, 'Rerendering should not add multiple listeners.')
    t.end()
  })

  test("Rendering an element with once-click handler", function(t) {
    class ClickableComponent extends Component {
      constructor(...args) {
        super(...args)
        this.clicks = 0
      }
      render($$) {
        return $$('a').append('Click me')
          .on('click', this.onClick, this, { once: true })
      }
      onClick() {
        this.clicks += 1
      }
    }

    let comp = ClickableComponent.render()
    comp.click()
    t.equal(comp.clicks, 1, 'Handler should have been triggered')
    comp.click()
    t.equal(comp.clicks, 1, 'Handler should not have been triggered again')
    t.end()
  })

  /* ##################### Nested Elements/Components ##########################*/

  test("Render children elements", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').addClass('parent')
        .append($$('div').addClass('child1'))
        .append($$('div').addClass('child2'))
    })
    t.equal(comp.el.getChildCount(), 2, 'Component should have two children.')
    t.ok(comp.el.hasClass('parent'), 'Element should have class "parent".')
    t.ok(comp.el.getChildAt(0).hasClass('child1'), 'First child should have class "child1".')
    t.ok(comp.el.getChildAt(1).hasClass('child2'), 'Second child should have class "child2".')
    t.end()
  })

  test("Render children components", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        $$(Simple, {
          children: ['a']
        }),
        $$(Simple, {
          children: ['b']
        })
      )
    })
    t.equal(comp.getChildCount(), 2, "Component should have two children")
    let first = comp.getChildAt(0)
    let second = comp.getChildAt(1)
    t.ok(first instanceof Simple, 'First child should be a Simple')
    t.equal(first.el.textContent, 'a', '.. and should have text "a".')
    t.ok(second instanceof Simple, 'Second child should be a Simple')
    t.equal(second.el.textContent, 'b', '.. and should have text "b".')
    t.end()
  })

  test("Render grandchildren elements", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        $$('div').addClass('child').append(
          $$('div').addClass('a'),
          $$('div').addClass('b')
        )
      )
    })
    t.equal(comp.getChildCount(), 1, "Component should have 1 child")
    let child = comp.getChildAt(0)
    t.equal(child.getChildCount(), 2, ".. and two grandchildren")
    let first = child.getChildAt(0)
    let second = child.getChildAt(1)
    t.ok(first.el.hasClass('a'), 'First should have class "a".')
    t.ok(second.el.hasClass('b'), 'Second should have class "b".')
    t.end()
  })


  test("Render nested elements passed via props", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        $$(Simple, {
          children: [
            $$('div').addClass('a'),
            $$('div').addClass('b')
          ]
        })
      )
    })
    t.equal(comp.getChildCount(), 1, "Component should have 1 child")
    let child = comp.getChildAt(0)
    t.equal(child.getChildCount(), 2, ".. and two grandchildren")
    let first = child.getChildAt(0)
    let second = child.getChildAt(1)
    t.ok(first.el.hasClass('a'), 'First grandchild should have class "a".')
    t.ok(second.el.hasClass('b'), 'Second grandchild should have class "b".')
    t.end()
  })

  // didMount is only called in browser
  test("Call didMount once when mounted", function(t) {
    class Child extends TestComponent {
      render($$) {
        if (this.props.loading) {
          return $$('div').append('Loading...')
        } else {
          return $$('div').append(
            $$(Simple).ref('child')
          )
        }
      }
    }
    class Parent extends TestComponent {
      render($$) {
        return $$('div')
          .append($$(Child,{loading: true}).ref('child'))
      }
      didMount() {
        this.refs.child.setProps({ loading: false })
      }
    }

    let comp = Parent.mount(t.sandbox)
    let childComp = comp.refs.child
    let grandChildComp = childComp.refs.child
    t.equal(childComp.didMount.callCount, 1, "Child's didMount should have been called only once.")
    t.equal(grandChildComp.didMount.callCount, 1, "Grandchild's didMount should have been called only once.")

    comp.empty()
    t.equal(childComp.dispose.callCount, 1, "Child's dispose should have been called once.")
    t.equal(grandChildComp.dispose.callCount, 1, "Grandchild's dispose should have been called once.")
    t.end()
  })

  test('Propagating properties to nested components', function(t) {
    class ItemComponent extends TestComponent {
      render($$) {
        return $$('div').append(this.props.name)
      }
    }
    class CompositeComponent extends TestComponent {
      render($$) {
        let el = $$('div').addClass('composite-component')
        for (let i = 0; i < this.props.items.length; i++) {
          let item = this.props.items[i]
          el.append($$(ItemComponent, item))
        }
        return el
      }
    }

    let comp = CompositeComponent.render({
      items: [ {name: 'A'}, {name: 'B'} ]
    })
    t.equal(comp.getChildCount(), 2, 'Component should have two children.')
    t.equal(comp.getChildAt(0).el.textContent, 'A', 'First child should have text A')
    t.equal(comp.getChildAt(1).el.textContent, 'B', 'First child should have text B')

    // Now we are gonna set new props
    comp.setProps({
      items: [ {name: 'X'}, {name: 'Y'} ]
    })
    t.equal(comp.getChildCount(), 2, 'Component should have two children.')
    t.equal(comp.getChildAt(0).el.textContent, 'X', 'First child should have text X')
    t.equal(comp.getChildAt(1).el.textContent, 'Y', 'First child should have text Y')
    t.end()
  })

  test("Special nesting situation", function(t) {
    // problem was observed in TOCPanel where components (tocEntry) are ingested via dependency-injection
    // and appended to a 'div' element (tocEntries) which then was ingested into a ScrollPane.
    // The order of _capturing must be determined correctly, i.e. first the ScrollPane needs to
    // be captured, so that the parent of the 'div' element (tocEntries) is known.
    // only then the tocEntry components can be captured.
    class Parent extends TestComponent {
      render($$) {
        let el = $$('div')
        // grandchildren wrapped into a 'div' element
        let grandchildren = $$('div').append(
          $$(GrandChild, { name: 'foo' }).ref('foo'),
          $$(GrandChild, { name: 'bar' }).ref('bar')
        )
        el.append(
          // grandchildren wrapper ingested into Child component
          $$(Child, {
            children: grandchildren
          })
        )
        return el
      }
    }
    class Child extends TestComponent {
      render($$) {
        return $$('div').append(this.props.children)
      }
    }
    class GrandChild extends TestComponent {
      render($$) {
        return $$('div').append(this.props.name)
      }
    }

    let comp = Parent.render()
    let foo = comp.refs.foo
    let bar = comp.refs.bar
    t.notNil(foo, "Component should have a ref 'foo'.")
    t.equal(foo.el.textContent, 'foo', "foo should have textContent 'foo'")
    t.notNil(bar, "Component should have a ref 'bar'.")
    t.equal(bar.el.textContent, 'bar', "bar should have textContent 'bar'")
    t.end()
  })

  test("Special nesting situation II", function(t) {
    class Parent extends Component {
      render($$) {
        return $$('div').addClass('parent').append(
          $$(Child, {
            children: [
              $$('div').addClass('grandchild-container').append(
                $$(Grandchild).ref('grandchild')
              )
            ]
          }).ref('child')
        )
      }
    }
    class Child extends Component {
      render($$) {
        let el = $$('div').addClass('child').append(
          this.props.children
        )
        return el
      }
    }
    class Grandchild extends Component {
      render($$) {
        return $$('div').addClass('grandchild')
      }
    }

    let comp = Parent.render()
    let child = comp.refs.child
    let grandchild = comp.refs.grandchild
    t.notNil(child, "Child should be referenced.")
    t.notNil(grandchild, "Grandchild should be referenced.")
    comp.rerender()
    t.ok(child === comp.refs.child, "Child should have been retained.")
    t.ok(grandchild === comp.refs.grandchild, "Grandchild should have been retained.")
    t.end()
  })

  // TODO: this test reveals that our rendering algorithm is not able
  // to preserve elements when ref'd components are passed down via props.
  // In such cases, the parent already
  test("Implicit retaining in 3-level nesting situation", function(t) {
    class Parent extends Component {
      render($$) {
        // Ideally, the 'wrapper' element and Child component would be preserved automatically
        // because of the ref'd component 'grandchild' passed via props.
        // However, ATM the rendering algorithm does not 'know' about the existence
        // of the ref'd component when rendering the top-level component.
        // This would be revealed during descent when the Child component
        // is rendered. A chicken egg problem: to decide to preserve the wrapper we need
        // to have it rendered already. We need to rethink the rendering algorithm.
        // For now, we need to ref the component which we pass the ref'd component into.
        return $$('div').addClass('parent').append(
          $$('div').addClass('wrapper').append(
            $$(Child, {
              children: [
                $$(Grandchild).ref('grandchild')
              ]
            })
            // disable the next line to reveal the problem
            .ref('child')
          )
        )
      }
    }
    class Child extends Component {
      render($$) {
        let el = $$('div').addClass('child').append(
          this.props.children
        )
        return el
      }
    }
    class Grandchild extends Component {
      render($$) {
        return $$('div').addClass('grandchild')
      }
    }
    let comp = Parent.render()
    let wrapper = comp.find('.wrapper')
    comp.rerender()
    let wrapper2 = comp.find('.wrapper')
    t.ok(wrapper.el === wrapper2.el, "wrapper element should have been retained.")
    t.end()
  })

  test("Edge case: unused children", function(t) {
    class Parent extends Component {
      render($$) {
        return $$('div').append(
          $$(Child, {
            // TODO: should this element be created at all?
            children: [$$('div').ref('unused')]
          })
        )
      }
    }
    class Child extends Component {
      render($$) {
        return $$('div')
      }
    }
    let comp = Parent.render()
    t.equal(comp.el.getChildCount(), 1, "Should have 1 child")
    t.equal(comp.el.textContent, '', "textContent should be empty")
    t.end()
  })

  test("Providing a ref'd child", function(t) {
    class Parent extends Component {
      render($$) {
        return $$('div').append(
          $$(Child, {
            children: [$$(Grandchild).ref('grandchild')]
          })
        )
      }
    }
    class Child extends Component {
      render($$) {
        return $$('div').append(this.props.children)
      }
    }
    class Grandchild extends Component {
      render($$) {
        return $$('div')
      }
    }
    let parent = Parent.render()
    t.equal(parent.getChildCount(), 1, "Should have 1 child")
    let child = parent.getChildAt(0)
    t.equal(child.getChildCount(), 1, "Should have 1 grandchild")
    let grandchild = child.getChildAt(0)
    t.ok(parent.refs.grandchild === grandchild, "Grandchild should be the same as the referenced component.")
    t.ok(child.props.children[0].getComponent() === grandchild, "Grandchild should be accessible via props of child.")
    t.end()
  })

  test("Implicit retaining should not override higher-level rules", function(t) {
    // If a child component has refs, itself should not be retained without
    // being ref'd by the parent
    class Parent extends Component {
      render($$) {
        // Child is not ref'd: this means the parent is not interested in keeping
        // this instance on rerender
        return $$('div').addClass('parent').append($$(Child))
      }
    }
    class Child extends Component {
      render($$) {
        // 'foo' is ref'd, so it should be retained when rerendering on this level
        let el = $$('div').addClass('child').append(
          $$('div').addClass('foo').ref('foo')
        )
        return el
      }
    }
    let comp = Parent.render()
    let child = comp.find('.child')
    t.notNil(child, "Child should exist.")
    let foo = child.refs.foo
    child.rerender()
    t.ok(child.refs.foo === foo, "'foo' should have been retained.")
    comp.rerender()
    let child2 = comp.find('.child')
    t.ok(child !== child2, "Child should have been renewed.")
    t.ok(foo !== child2.refs.foo, "'foo' should be different as well.")
    t.end()
  })

  test("Eventlisteners on child element", function(t) {
    class Parent extends Component {
      render($$) {
        return $$('div').append($$(Child).ref('child'))
      }
    }
    class Child extends Component {
      constructor(...args) {
        super(...args)
        this.clicks = 0
      }
      render($$) {
        return $$('a').append('Click me').on('click', this.onClick)
      }
      onClick() {
        this.clicks++
      }
    }

    let comp = Parent.render()
    let child = comp.refs.child
    child.click()
    t.equal(child.clicks, 1, 'Handler should have been triggered')
    comp.rerender()
    child.clicks = 0
    child.click()
    t.equal(child.clicks, 1, 'Handler should have been triggered')
    t.end()
  })


  /* ##################### Refs: Preserving Components ##########################*/

  test("Children without a ref are not retained", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        $$(Simple)
      )
    })
    let child = comp.getChildAt(0)
    comp.rerender()
    let newChild = comp.getChildAt(0)
    // as we did not apply a ref, the component should get rerendered from scratch
    t.ok(newChild !== child, 'Child component should have been renewed.')
    t.ok(newChild.el !== child.el, 'Child element should have been renewed.')
    t.end()
  })

  test("A ref must be unique in owner scope (fail on inadvertent reuse)", function(t) {
    class MyComponent extends TestComponent {
      render($$) {
        return $$('div')
          .append($$('div').ref('foo'))
          .append($$('div').ref('foo'))
      }
    }
    t.throws(function() {
      MyComponent.render()
    }, "Should throw an exception when a reference id is used multiple times")
    t.end()
  })

  test("Render a child element with ref", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').addClass('parent')
        .append($$('div').addClass('child').ref('foo'))
    })
    t.notNil(comp.refs.foo, 'Component should have a ref "foo".')
    t.ok(comp.refs.foo.hasClass('child'), 'Referenced component should have class "child".')
    // check that the instance is retained after rerender
    let child = comp.refs.foo
    let el = child.getNativeElement()
    comp.rerender()
    t.ok(comp.refs.foo === child, 'Child element should have been preserved.')
    t.ok(comp.refs.foo.getNativeElement() === el, 'Native element should be the same.')
    t.end()
  })

  test("Render a child component with ref", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        $$(Simple).ref('foo')
      )
    })
    let child = comp.refs.foo
    let el = child.getNativeElement()
    comp.rerender()
    t.ok(comp.refs.foo === child, 'Child component should have been preserved.')
    t.ok(comp.refs.foo.getNativeElement() === el, 'Native element should be the same.')
    t.end()
  })

  test("Rerendering a child component with ref triggers didUpdate()", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        $$(Simple).ref('foo')
      )
    })
    let child = comp.refs.foo
    spy(child, 'didUpdate')
    comp.rerender()
    t.ok(child.didUpdate.callCount === 1, "child.didUpdate() should have been called once.")
    t.end()
  })

  test("Trigger didUpdate() on children even when shouldRerender()=false", function(t) {
    class Child extends Component {
      shouldRerender() {
        return false
      }
    }
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        // change prop randomly
        $$(Child, {foo: Date.now()}).ref('foo')
      )
    })
    let child = comp.refs.foo
    spy(child, 'didUpdate')
    comp.rerender()
    t.ok(child.didUpdate.callCount === 1, "child.didUpdate() should have been called once.")
    t.end()
  })

  test("didUpdate() provides old props and old state", function(t) {
    let oldProps = null
    let oldState = null
    class MyComponent extends Component {
      getInitialState() {
        return {
          val: 1
        }
      }
      didUpdate(_oldProps, _oldState) {
        oldProps = _oldProps
        oldState = _oldState
      }
    }
    let comp = MyComponent.mount({
      val: 'a'
    }, t.sandbox)
    comp.setState({ val: 2 })
    t.notNil(oldProps, 'old props should have been provided')
    t.equal(oldProps.val, 'a', 'old props should contain original value')
    t.notNil(oldState, 'old state should have been provided')
    t.equal(oldState.val, 1, 'old state should contain original value')
    oldProps = null
    oldState = null
    comp.setProps({ val: 'b' })
    t.notNil(oldProps, 'old props should have been provided')
    t.equal(oldProps.val, 'a', 'old props should contain original value')
    t.notNil(oldState, 'old state should have been provided')
    t.equal(oldState.val, 2, 'old state should contain original value')
    t.end()
  })

  test("Refs on grandchild elements.", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        $$('div').append(
          $$('div').ref(this.props.grandChildRef) // eslint-disable-line no-invalid-this
        )
      )
    }, { grandChildRef: "foo"})

    t.notNil(comp.refs.foo, "Ref 'foo' should be set.")
    let foo = comp.refs.foo
    comp.rerender()
    t.ok(foo === comp.refs.foo, "Referenced grandchild should have been retained.")
    spy(foo, 'dispose')
    comp.setProps({ grandChildRef: "bar" })
    t.ok(foo.dispose.callCount > 0, "Former grandchild should have been disposed.")
    t.notNil(comp.refs.bar, "Ref 'bar' should be set.")
    t.ok(foo !== comp.refs.bar, "Grandchild should have been recreated.")
    t.end()
  })

  // it happened, that a grandchild component with ref was not preserved
  test("Ref on grandchild component.", function(t) {
    class Grandchild extends TestComponent {
      render($$) {
        return $$('div').append(this.props.foo)
      }
    }

    let comp = TestComponent.create(function($$) {
      let el = $$('div')
      el.append(
        $$('div').append(
          // generating a random property making sure the grandchild gets rerendered
          $$(Grandchild, { foo: String(Date.now()) }).ref('grandchild')
        )
      )
      return el
    })
    t.notNil(comp.refs.grandchild, "Ref 'grandchild' should be set.")
    let grandchild = comp.refs.grandchild
    comp.rerender()
    t.notNil(comp.refs.grandchild, "Ref 'grandchild' should be set.")
    t.ok(comp.refs.grandchild === grandchild, "'grandchild' should be the same")
    t.end()
  })

  test("Retain refs owned by parent but nested in child component.", function(t) {
    // Note: the child component does not know that there is a ref
    // set by the parent. Still, the component should be retained on rerender
    class Child extends TestComponent {
      render($$) {
        return $$('div').append(
          $$('div').append(this.props.children)
        )
      }
    }

    let comp = TestComponent.create(function($$) {
      let el = $$('div')
      el.append(
        $$('div').append(
          // generating a random property making sure the grandchild gets rerendered
          $$(Child).ref('child').append(
            $$('div').append('foo').ref('grandchild')
          )
        )
      )
      return el
    })
    t.notNil(comp.refs.grandchild, "Ref 'grandchild' should be set.")
    let grandchild = comp.refs.grandchild
    comp.rerender()
    t.ok(comp.refs.grandchild === grandchild, "'grandchild' should be the same")
    t.end()
  })

  test("Should wipe a referenced component when class changes", function(t) {
    class ComponentA extends TestComponent {
      render($$) {
        return $$('div').addClass('component-a')
      }
    }
    class ComponentB extends TestComponent {
      render($$) {
        return $$('div').addClass('component-b')
      }
    }
    class MainComponent extends TestComponent {
      render($$) {
        let el = $$('div').addClass('context')
        let ComponentClass
        if (this.props.context ==='A') {
          ComponentClass = ComponentA
        } else {
          ComponentClass = ComponentB
        }
        el.append($$(ComponentClass).ref('context'))
        return el
      }
    }

    let comp = MainComponent.render({context: 'A'})
    t.ok(comp.refs.context instanceof ComponentA, 'Context should be of instance ComponentA')
    comp.setProps({context: 'B'})
    t.ok(comp.refs.context instanceof ComponentB, 'Context should be of instance ComponentB')
    t.end()
  })

  test('Should store refs always on owners', function(t) {
    class MyComponent extends TestComponent {
      render($$) {
        return $$('div').append(
          $$(Simple).append(
            $$('div').ref('helloComp')
          ).ref('simpleComp')
        )
      }
    }
    let comp = MyComponent.render(MyComponent)
    t.ok(comp.refs.helloComp, 'There should stil be a ref to the helloComp element/component')
    t.end()
  })

  test("Implicitly retain elements when grandchild elements have refs.", function(t) {
    let comp = TestComponent.create(function($$) {
      return $$('div').append(
        $$('div').append(
          $$('div').ref(this.props.grandChildRef) // eslint-disable-line no-invalid-this
        )
      )
    }, { grandChildRef: "foo"})

    let child = comp.getChildAt(0)
    comp.rerender()
    t.ok(child === comp.getChildAt(0), "Child should be retained.")
    t.ok(child.el === comp.getChildAt(0).el, "Child element should be retained.")
    t.end()
  })

  test("Implicitly retain elements when passing grandchild with ref.", function(t) {
    class Child extends TestComponent {
      render($$) {
        return $$('div').append(
          $$('div').append(this.props.children)
        )
      }
    }

    let comp = TestComponent.create(function($$) {
      let grandchild = $$('div').ref('grandchild')
      return $$('div').append(
        $$(Child).append(grandchild)
      )
    })

    let child = comp.getChildAt(0)
    comp.rerender()
    t.ok(child === comp.getChildAt(0), "Child should be retained.")
    t.ok(child.el === comp.getChildAt(0).el, "Child element should be retained.")
    t.end()
  })

  // In ScrollPane we provied a link into the Srollbar which accesses
  // ScrollPanes ref in didUpdate()
  // This is working fine when didUpdate() is called at the right time,
  // i.e., when ScrollPane has been rendered already
  test("Everthing should be rendered when didUpdate() is triggered.", function(t) {
    let parentIsUpdated = false
    class Parent extends Component {
      render($$) {
        return $$('div').append(
          $$(Child, {parent: this}).ref('child')
        )
      }
    }
    class Child extends Component {
      render($$) {
        return $$('div')
      }
      didUpdate() {
        if (this.props.parent.el) {
          parentIsUpdated = true
        }
      }
    }

    let comp = Parent.render()
    // didUpdate() should not have been called (no rerender)
    t.notOk(parentIsUpdated, 'Initially child.didUpdate() should not have been called.')
    comp.rerender()
    t.ok(parentIsUpdated, 'After rerender child.didUpdate() should have access to parent.el')
    t.end()
  })

  /* ##################### Integration tests / Issues ##########################*/

  test('Preserve components when ref matches and rerender when props changed', function(t) {

    class ItemComponent extends TestComponent {
      shouldRerender(nextProps) {
        return !isEqual(nextProps, this.props)
      }
      render($$) {
        return $$('div').append(this.props.name)
      }
    }
    class CompositeComponent extends TestComponent {
      render($$) {
        let el = $$('div').addClass('composite-component')
        this.props.items.forEach(function(item) {
          el.append($$(ItemComponent, {name: item.name}).ref(item.ref))
        })
        return el
      }
    }

    // Initial mount
    let comp = CompositeComponent.render({
      items: [
        {ref: 'a', name: 'A'},
        {ref: 'b', name: 'B'},
        {ref: 'c', name: 'C'}
      ]
    })

    let a = comp.refs.a
    let b = comp.refs.b
    let c = comp.refs.c

    let childNodes = comp.childNodes
    t.equal(childNodes.length, 3, 'Component should have 3 children.')
    t.equal(childNodes[0].textContent, 'A', '.. first child should have text A')
    t.equal(childNodes[1].textContent, 'B', '.. second child should have text B')
    t.equal(childNodes[2].textContent, 'C', '.. third child should have text C')

    comp.refs.a.render.reset()
    comp.refs.b.render.reset()

    // Props update that preserves some of our components, drops some others
    // and adds some new
    comp.setProps({
      items: [
        {ref: 'a', name: 'X'}, // preserved (props changed)
        {ref: 'd', name: 'Y'}, // new
        {ref: 'b', name: 'B'}, // preserved (same props)
        {ref: 'e', name: 'Z'}  // new
      ]
    })

    childNodes = comp.childNodes
    t.equal(childNodes.length, 4, 'Component should now have 4 children.')
    // a and b should have been preserved
    t.equal(a, comp.refs.a, '.. a should be the same instance')
    t.equal(b, comp.refs.b, '.. b should be the same component instance')
    // c should be gone
    t.equal(c.dispose.callCount, 1, '.. c should have been unmounted')
    // a should have been rerendered (different props) while b should not (same props)
    t.ok(a.render.callCount > 0, '.. Component a should have been rerendered')
    t.equal(b.render.callCount, 0, '.. Component b should not have been rerendered')
    // check content
    t.equal(childNodes[0].textContent, 'X', '.. first child should have text X')
    t.equal(childNodes[1].textContent, 'Y', '.. second child should have text Y')
    t.equal(childNodes[2].textContent, 'B', '.. third child should have text Y')
    t.equal(childNodes[3].textContent, 'Z', '.. fourth child should have text Z')
    t.end()
  })

  // Note: this is more of an integration test, but I did not manage to isolate the error
  // maybe the solution gets us closer to what actually went wrong.
  // TODO: try to split into useful smaller pieces.
  test("Unspecific integration test:  ref'd component must be retained", function(t) {
    class ComponentWithRefs extends Component {
      getInitialState() {
        return {contextId: 'hello'}
      }
      render($$) {
        let el = $$('div').addClass('lc-lens lc-writer sc-controller')

        let workspace = $$('div').ref('workspace').addClass('le-workspace')

        workspace.append(
          // Main (left column)
          $$('div').ref('main').addClass("le-main").append(
            $$(Simple).ref('toolbar').append($$(Simple)),

            $$(Simple).ref('contentPanel').append(
              $$(Simple).ref('coverEditor'),

              // The full fledged document (ContainerEditor)
              $$("div").ref('content').addClass('document-content').append(
                $$(Simple, {
                }).ref('mainEditor')
              ),
              $$(Simple).ref('bib')
            )
          )
        )

        // Context section (right column)
        workspace.append(
          $$(Simple, {
          }).ref(this.state.contextId)
        )

        el.append(workspace)

        // Status bar
        el.append(
          $$(Simple, {}).ref('statusBar')
        )
        return el
      }
    }

    let comp = ComponentWithRefs.render()
    t.ok(comp.refs.contentPanel, 'There should be a ref to the contentPanel component')
    comp.setState({contextId: 'foo'})
    t.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component')
    comp.setState({contextId: 'bar'})
    t.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component')
    comp.setState({contextId: 'baz'})
    t.ok(comp.refs.contentPanel, 'There should stil be a ref to the contentPanel component')
    t.end()
  })

  test("#312: refs should be bound to the owner, not to the parent.", function(t) {
    class Child extends TestComponent {
      render($$) {
        return $$('div').append(this.props.children)
      }
    }
    class Parent extends TestComponent {
      render($$) {
        let el = $$('div')
        el.append(
          $$(Child).append(
            $$('div').ref('foo').append('foo')
          )
        )
        return el
      }
    }
    let comp = Parent.render()
    t.notNil(comp.refs.foo, 'Ref should be bound to owner.')
    t.equal(comp.refs.foo.text(), 'foo', 'Ref should point to the right component.')
    t.end()
  })

  test('#635: Relocating a preserved component', function(t) {
    class Parent extends TestComponent {
      render($$) {
        let el = $$('div')
        el.append('X')
        if (this.props.nested) {
          el.append(
            $$('div').append(
              $$(Simple).ref('foo').append('Y')
            )
          )
        } else {
          el.append(
            $$(Simple).ref('foo').append('Y')
          )
        }
        el.append('Z')
        return el
      }
    }
    let comp = Parent.render()
    t.equal(comp.refs.foo.getParent(), comp, "First 'foo' should be direct child.")
    t.equal(comp.el.textContent, 'XYZ', "... and content should be correct.")
    comp.setProps({ nested: true })
    t.equal(comp.refs.foo.getParent().getParent(), comp, "Then 'foo' should be grand-child.")
    t.equal(comp.el.textContent, 'XYZ', "... and content should be correct.")
    comp.setProps({})
    t.equal(comp.refs.foo.getParent(), comp, "At last 'foo' should be direct child again.")
    t.equal(comp.el.textContent, 'XYZ', "... and content should be correct.")
    t.end()
  })

  test("Combine props and children via append", function(t) {
    class Toolbar extends TestComponent {
      render($$) {
        let el = $$('div').append(
          $$(Simple, this.props.strong).append('Strong')
        )
        return el
      }
    }

    let toolState = {strong: {active: true}}
    Toolbar.render(toolState)
    // the original toolState object should not have been changed
    t.ok(isEqual(toolState, {strong: {active: true}}), "props object should not have been touched")
    t.end()
  })

  test("Pass-through props and add children via append", function(t) {
    class MyComponent extends TestComponent {
      render($$) {
        let el = $$('div').append(
          $$(Simple, this.props).append('Child 1')
        )
        return el
      }
    }
    let props = {foo: 'bar'}
    let comp = MyComponent.render(props)
    let simple = comp.getChildAt(0)
    t.notNil(simple, 'Should have a child component.')
    t.equal(simple.props.foo, props.foo, '.. with props past through')
    t.equal(simple.props.children.length, 1, '.. with props.children having one element')
    t.equal(simple.textContent, 'Child 1', '.. with correct text content')
    t.end()
  })

}
