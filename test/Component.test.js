import { test as substanceTest, spy } from 'substance-test'
import { DefaultDOMElement, substanceGlobals, isEqual, Component, platform, isArrayEqual } from 'substance'
import { getMountPoint } from './shared/testHelpers'
import TestComponent from './fixture/TestComponent'

class Simple extends TestComponent {
  render ($$) {
    var el = $$('div').addClass('sc-simple')
    if (this.props.children) {
      el.append(this.props.children)
    }
    return el
  }
}

// regular rendering using default DOM elements
ComponentTests()

// RenderingEngine in debug mode
ComponentTests('debug')

// in the browser do an extra run using MemoryDOM
if (platform.inBrowser) {
  ComponentTests(false, 'memory')
}

function ComponentTests (debug, memory) {
  const LABEL = 'Component' + (debug ? ' [debug]' : '') + (memory ? ' [memory]' : '')
  const test = (title, fn) => substanceTest(`${LABEL}: ${title}`, t => {
    // before
    substanceGlobals.DEBUG_RENDERING = Boolean(debug)
    if (memory) platform.inBrowser = false
    t._document = DefaultDOMElement.createDocument('html')
    try {
      fn(t)
    } finally {
      // after
      platform._reset()
    }
  })

  test('Throw error when render method is not returning an element', t => {
    class NilRender extends TestComponent {
      render () {}
    }
    t.throws(() => {
      NilRender.render()
    }, 'Should throw an exception when render does return nil')

    class InvalidRender extends TestComponent {
      render ($$) {
        return 'foo'
      }
    }
    t.throws(() => {
      InvalidRender.render()
    }, /must return a plain element/, 'Should throw an exception when render does not return a virtual element')

    t.end()
  })

  test('Mounting a component', t => {
    // Mounting a detached element
    let doc = t._document.createDocument('html')
    let el = doc.createElement('div')
    let comp = Simple.mount(el)
    t.equal(comp.didMount.callCount, 0, 'didMount() must not be called when mounting to detached elements')
    // Mounting an attached element
    comp = Simple.mount(doc.firstChild)
    t.equal(comp.didMount.callCount, 1, 'didMount() should have been called')
    t.end()
  })

  test('Render an HTML element', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div')
    })
    t.equal(comp.el.tagName, 'div', 'Element should be a "div".')
    comp = TestComponent.create(function ($$) {
      return $$('span')
    })
    t.equal(comp.el.tagName, 'span', 'Element should be a "span".')
    t.end()
  })

  test('Render an element with attributes', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').attr('data-id', 'foo')
    })
    t.equal(comp.el.attr('data-id'), 'foo', 'Element should have data-id="foo".')
    t.end()
  })

  test('Render an element with css styles', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').css('width', '100px')
    })
    t.equal(comp.el.css('width'), '100px', 'Element should have css width of 100px.')
    t.end()
  })

  test('Render an element with classes', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').addClass('test')
    })
    t.ok(comp.el.hasClass('test'), 'Element should have css class "test".')
    t.end()
  })

  test('Render an element with value', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('input').attr('type', 'text').val('foo')
    })
    t.equal(comp.el.val(), 'foo', 'Value should be set.')
    t.end()
  })

  test('Render an element with plain text', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').text('foo')
    })
    t.equal(comp.el.textContent, 'foo', 'textContent should be set.')
    t.end()
  })

  test('Render an element with custom html', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').html('Hello <b>World</b>')
    })
    // ATTENTION: it is important to call find() on the element API
    // not on the Component API, as Component#find will only provide
    // elements which are Component instance.
    let b = comp.el.find('b')
    t.notNil(b, 'Element should have rendered HTML as content.')
    t.equal(b.textContent, 'World', 'Rendered element should have right content.')
    t.end()
  })

  test('Rendering an element with HTML attributes etc.', t => {
    let comp = TestComponent.create(function ($$) {
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

  test('Rendering an input element with value', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('input').attr('type', 'text').val('foo')
    })
    t.equal(comp.el.val(), 'foo', 'Input field should have value "foo".')
    t.end()
  })

  test('Render a component', t => {
    let comp = Simple.render()
    t.equal(comp.el.tagName.toLowerCase(), 'div', 'Element should be a "div".')
    t.ok(comp.el.hasClass('sc-simple'), 'Element should have class "sc-simple".')
    t.end()
  })

  test('Rerender on setProps()', t => {
    let comp = Simple.render({ foo: 'bar ' })
    comp.shouldRerender.reset()
    comp.render.reset()
    comp.setProps({ foo: 'baz' })
    t.ok(comp.shouldRerender.callCount > 0, 'Component should have been asked whether to rerender.')
    t.ok(comp.render.callCount > 0, 'Component should have been rerendered.')
    t.end()
  })

  test('Rerendering triggers didUpdate()', t => {
    let comp = Simple.render({ foo: 'bar ' })
    spy(comp, 'didUpdate')
    comp.rerender()
    t.ok(comp.didUpdate.callCount === 1, 'didUpdate() should have been called once.')
    t.end()
  })

  test('Setting props triggers willReceiveProps()', t => {
    let comp = Simple.render({ foo: 'bar ' })
    spy(comp, 'willReceiveProps')
    comp.setProps({ foo: 'baz' })
    t.ok(comp.willReceiveProps.callCount === 1, 'willReceiveProps() should have been called once.')
    t.end()
  })

  test('Rerender on setState()', t => {
    let comp = Simple.render()
    comp.shouldRerender.reset()
    comp.render.reset()
    comp.setState({ foo: 'baz' })
    t.ok(comp.shouldRerender.callCount > 0, 'Component should have been asked whether to rerender.')
    t.ok(comp.render.callCount > 0, 'Component should have been rerendered.')
    t.end()
  })

  test('Setting state triggers willUpdateState()', t => {
    let comp = Simple.render()
    spy(comp, 'willUpdateState')
    comp.setState({ foo: 'baz' })
    t.ok(comp.willUpdateState.callCount === 1, 'willUpdateState() should have been called once.')
    t.end()
  })

  test('Trigger didUpdate() when state or props have changed even with shouldRerender() = false', t => {
    class A extends Component {
      shouldRerender () {
        return false
      }
      render ($$) {
        return $$('div')
      }
    }
    let comp = A.render()
    spy(comp, 'didUpdate')
    // component will not rerender but still should trigger didUpdate()
    comp.setProps({foo: 'bar'})
    t.ok(comp.didUpdate.callCount === 1, 'didUpdate() should have been called once.')
    comp.didUpdate.reset()
    comp.setState({foo: 'bar'})
    t.ok(comp.didUpdate.callCount === 1, 'didUpdate() should have been called once.')
    t.end()
  })

  test('Dependency-Injection', t => {
    class Parent extends Component {
      getChildContext () {
        let childContext = {}
        if (this.props.name) {
          childContext[this.props.name] = this.props.name
        }
        return childContext
      }
      render ($$) {
        let el = $$('div')
        // direct child
        el.append($$(Child).ref('a'))
        // indirect child
        el.append($$('div').append(
          $$(Child).ref('b')
        ))
        el.append(
          $$(Wrapper, {
            name: 'bar',
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
      render ($$) {
        return $$('div')
      }
    }
    class Wrapper extends Component {
      render ($$) {
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

  /* ##################### Rerendering ########################## */

  test('Rerendering varying content', t => {
    class TestComponent extends Component {
      getInitialState () {
        return { mode: 0 }
      }
      render ($$) {
        let el = $$('div')
        if (this.state.mode === 0) {
          el.append(
            'Foo',
            $$('br')
          )
        } else {
          el.append(
            'Bar',
            $$('span'),
            'Baz',
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

  test('Rendering an element with click handler', t => {
    class ClickableComponent extends Component {
      constructor (...args) {
        super(...args)
        this.value = 0
      }
      render ($$) {
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
      onClick () {
        this.value += 1
      }
    }

    t.comment('rendering without click handler...')
    let comp = ClickableComponent.render()
    comp.click()
    t.equal(comp.value, 0, 'handler should not have been triggered.')

    t.comment('rendering with an instance method as click handler...')
    comp.value = 0
    comp.setProps({method: 'instance'})
    comp.click()
    t.equal(comp.value, 1, 'handler should have been triggered.')
    comp.rerender()
    comp.click()
    t.equal(comp.value, 2, 're-rendering should not add multiple listeners.')

    t.comment('rendering with an anonymous click handler...')
    comp.value = 0
    comp.setProps({method: 'anonymous'})
    comp.click()
    t.equal(comp.value, 10, 'handler should have been triggered.')
    comp.rerender()
    comp.click()
    t.equal(comp.value, 20, 're-rendering should not add multiple listeners.')
    t.end()
  })

  test('Rendering an element with once-click handler', t => {
    class ClickableComponent extends Component {
      constructor (...args) {
        super(...args)
        this.clicks = 0
      }
      render ($$) {
        return $$('a').append('Click me')
          .on('click', this.onClick, this, { once: true })
      }
      onClick () {
        this.clicks += 1
      }
    }

    let comp = ClickableComponent.render()
    comp.click()
    t.equal(comp.clicks, 1, 'handler should have been triggered')
    comp.click()
    t.equal(comp.clicks, 1, 'handler should not have been triggered again')
    t.end()
  })

  test('Not re-rendering an attribute should remove the attribute from the rendered element', (t) => {
    class TestComponent extends Component {
      getInitialState () {
        return { mode: 0 }
      }
      render ($$) {
        let el = $$('div')
        if (this.state.mode === 0) {
          el.attr('contenteditable', true)
        }
        return el
      }
    }
    let comp = TestComponent.render()
    t.equal(comp.el.getAttribute('contenteditable'), 'true', 'attribute should be present.')
    comp.setState({ mode: 1 })
    t.isNil(comp.el.getAttribute('contenteditable'), 'attribute should have been removed.')
    t.end()
  })

  /* ##################### Nested Elements/Components ########################## */

  test('Render children elements', t => {
    let comp = TestComponent.create(function ($$) {
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

  test('Render children components', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').append(
        $$(Simple, {
          children: ['a']
        }),
        $$(Simple, {
          children: ['b']
        })
      )
    })
    t.equal(comp.getChildCount(), 2, 'Component should have two children')
    let first = comp.getChildAt(0)
    let second = comp.getChildAt(1)
    t.ok(first instanceof Simple, 'First child should be a Simple')
    t.equal(first.el.textContent, 'a', '.. and should have text "a".')
    t.ok(second instanceof Simple, 'Second child should be a Simple')
    t.equal(second.el.textContent, 'b', '.. and should have text "b".')
    t.end()
  })

  test('Render grandchildren elements', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').append(
        $$('div').addClass('child').append(
          $$('div').addClass('a'),
          $$('div').addClass('b')
        )
      )
    })
    t.equal(comp.getChildCount(), 1, 'Component should have 1 child')
    let child = comp.getChildAt(0)
    t.equal(child.getChildCount(), 2, '.. and two grandchildren')
    let first = child.getChildAt(0)
    let second = child.getChildAt(1)
    t.ok(first.el.hasClass('a'), 'First should have class "a".')
    t.ok(second.el.hasClass('b'), 'Second should have class "b".')
    t.end()
  })

  test('Render nested elements passed via props', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').append(
        $$(Simple, {
          children: [
            $$('div').addClass('a'),
            $$('div').addClass('b')
          ]
        })
      )
    })
    t.equal(comp.getChildCount(), 1, 'Component should have 1 child')
    let child = comp.getChildAt(0)
    t.equal(child.getChildCount(), 2, '.. and two grandchildren')
    let first = child.getChildAt(0)
    let second = child.getChildAt(1)
    t.ok(first.el.hasClass('a'), 'First grandchild should have class "a".')
    t.ok(second.el.hasClass('b'), 'Second grandchild should have class "b".')
    t.end()
  })

  test('Call didMount once when mounted', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div')
          .append($$(Child, {loading: true}).ref('child'))
      }
      didMount () {
        this.refs.child.setProps({ loading: false })
      }
    }
    class Child extends TestComponent {
      render ($$) {
        if (this.props.loading) {
          return $$('div').append('Loading...')
        } else {
          return $$('div').append(
            $$(Simple).ref('child')
          )
        }
      }
    }

    let parent = Parent.mount(getMountPoint(t))
    let child = parent.refs.child
    let grandChild = child.refs.child
    t.equal(child.didMount.callCount, 1, "Child's didMount should have been called.")
    t.notNil(grandChild, 'Grandchild should have been rendered')
    t.equal(grandChild.didMount.callCount, 1, "Grandchild's didMount should have been called too.")

    parent.empty()
    t.equal(child.dispose.callCount, 1, "Child's dispose should have been called once.")
    t.equal(grandChild.dispose.callCount, 1, "Grandchild's dispose should have been called once.")
    t.end()
  })

  test('Propagating properties to nested components', t => {
    class ItemComponent extends TestComponent {
      render ($$) {
        return $$('div').append(this.props.name)
      }
    }
    class CompositeComponent extends TestComponent {
      render ($$) {
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

  test('Special nesting situation', t => {
    // problem was observed in TOCPanel where components (tocEntry) are ingested via dependency-injection
    // and appended to a 'div' element (tocEntries) which then was ingested into a ScrollPane.
    // The order of _capturing must be determined correctly, i.e. first the ScrollPane needs to
    // be captured, so that the parent of the 'div' element (tocEntries) is known.
    // only then the tocEntry components can be captured.
    class Parent extends TestComponent {
      render ($$) {
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
      render ($$) {
        return $$('div').append(this.props.children)
      }
    }
    class GrandChild extends TestComponent {
      render ($$) {
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

  test('Special nesting situation II', t => {
    class Parent extends Component {
      render ($$) {
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
      render ($$) {
        let el = $$('div').addClass('child').append(
          this.props.children
        )
        return el
      }
    }
    class Grandchild extends Component {
      render ($$) {
        return $$('div').addClass('grandchild')
      }
    }

    let comp = Parent.render()
    let child = comp.refs.child
    let grandchild = comp.refs.grandchild
    t.notNil(child, 'Child should be referenced.')
    t.notNil(grandchild, 'Grandchild should be referenced.')
    comp.rerender()
    t.ok(child === comp.refs.child, 'Child should have been retained.')
    t.ok(grandchild === comp.refs.grandchild, 'Grandchild should have been retained.')
    t.end()
  })

  // TODO: this test reveals that our rendering algorithm is not able
  // to preserve elements when ref'd components are passed down via props.
  // In such cases, the parent already
  test('Implicit retaining in 3-level nesting situation', t => {
    class Parent extends Component {
      render ($$) {
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
      render ($$) {
        let el = $$('div').addClass('child').append(
          this.props.children
        )
        return el
      }
    }
    class Grandchild extends Component {
      render ($$) {
        return $$('div').addClass('grandchild')
      }
    }
    let comp = Parent.render()
    let wrapper = comp.find('.wrapper')
    comp.rerender()
    let wrapper2 = comp.find('.wrapper')
    t.ok(wrapper.el === wrapper2.el, 'wrapper element should have been retained.')
    t.end()
  })

  test('Edge case: unused children', t => {
    class Parent extends Component {
      render ($$) {
        return $$('div').append(
          $$(Child, {
            // TODO: should this element be created at all?
            children: [$$('div').ref('unused')]
          })
        )
      }
    }
    class Child extends Component {
      render ($$) {
        return $$('div')
      }
    }
    let comp = Parent.render()
    t.equal(comp.el.getChildCount(), 1, 'Should have 1 child')
    t.equal(comp.el.textContent, '', 'textContent should be empty')
    t.end()
  })

  test("Providing a ref'd child", t => {
    class Parent extends Component {
      render ($$) {
        return $$('div').append(
          $$(Child, {
            children: [$$(Grandchild).ref('grandchild')]
          })
        )
      }
    }
    class Child extends Component {
      render ($$) {
        return $$('div').append(this.props.children)
      }
    }
    class Grandchild extends Component {
      render ($$) {
        return $$('div')
      }
    }
    let parent = Parent.render()
    t.equal(parent.getChildCount(), 1, 'Should have 1 child')
    let child = parent.getChildAt(0)
    t.equal(child.getChildCount(), 1, 'Should have 1 grandchild')
    let grandchild = child.getChildAt(0)
    t.ok(parent.refs.grandchild === grandchild, 'Grandchild should be the same as the referenced component.')
    t.ok(child.props.children[0].getComponent() === grandchild, 'Grandchild should be accessible via props of child.')
    t.end()
  })

  test('Eventlisteners on child element', t => {
    class Parent extends Component {
      render ($$) {
        return $$('div').append($$(Child).ref('child'))
      }
    }
    class Child extends Component {
      constructor (...args) {
        super(...args)
        this.clicks = 0
      }
      render ($$) {
        return $$('a').append('Click me').on('click', this.onClick)
      }
      onClick () {
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

  /* ##################### Refs: Preserving Components ########################## */

  test('A ref must be unique in owner scope (fail on inadvertent reuse)', t => {
    class MyComponent extends TestComponent {
      render ($$) {
        return $$('div')
          .append($$('div').ref('foo'))
          .append($$('div').ref('foo'))
      }
    }
    t.throws(function () {
      MyComponent.render()
    }, 'Should throw an exception when a reference id is used multiple times')
    t.end()
  })

  test('Render a child element with ref', t => {
    let comp = TestComponent.create(function ($$) {
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

  test('Render a child component with ref', t => {
    let comp = TestComponent.create(function ($$) {
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

  test('Rerendering a child component with ref triggers didUpdate()', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').append(
        $$(Simple).ref('foo')
      )
    })
    let child = comp.refs.foo
    spy(child, 'didUpdate')
    comp.rerender()
    t.ok(child.didUpdate.callCount === 1, 'child.didUpdate() should have been called once.')
    t.end()
  })

  test('Trigger didUpdate() on children even when shouldRerender()=false', t => {
    class Child extends Component {
      shouldRerender () {
        return false
      }
    }
    let comp = TestComponent.create(function ($$) {
      return $$('div').append(
        // change prop randomly
        $$(Child, {foo: Date.now()}).ref('foo')
      )
    })
    let child = comp.refs.foo
    spy(child, 'didUpdate')
    comp.rerender()
    t.ok(child.didUpdate.callCount === 1, 'child.didUpdate() should have been called once.')
    t.end()
  })

  test('didUpdate() provides old props and old state', t => {
    let oldProps = null
    let oldState = null
    class MyComponent extends Component {
      getInitialState () {
        return {
          val: 1
        }
      }
      didUpdate (_oldProps, _oldState) {
        oldProps = _oldProps
        oldState = _oldState
      }
    }
    let comp = MyComponent.mount({
      val: 'a'
    }, getMountPoint(t))
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

  test('Refs on grandchild elements.', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').append(
        $$('div').append(
          $$('div').ref(this.props.grandChildRef) // eslint-disable-line no-invalid-this
        )
      )
    }, { grandChildRef: 'foo' })

    t.notNil(comp.refs.foo, "Ref 'foo' should be set.")
    let foo = comp.refs.foo
    comp.rerender()
    t.ok(foo === comp.refs.foo, 'Referenced grandchild should have been retained.')
    spy(foo, 'dispose')
    comp.setProps({ grandChildRef: 'bar' })
    t.ok(foo.dispose.callCount > 0, 'Former grandchild should have been disposed.')
    t.notNil(comp.refs.bar, "Ref 'bar' should be set.")
    t.ok(foo !== comp.refs.bar, 'Grandchild should have been recreated.')
    t.end()
  })

  // it happened, that a grandchild component with ref was not preserved
  test('Ref on grandchild component.', t => {
    class Grandchild extends TestComponent {
      render ($$) {
        return $$('div').append(this.props.foo)
      }
    }

    let comp = TestComponent.create(function ($$) {
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

  test('Retain refs owned by parent but nested in child component.', t => {
    // Note: the child component does not know that there is a ref
    // set by the parent. Still, the component should be retained on rerender
    class Child extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('div').append(this.props.children)
        )
      }
    }

    let comp = TestComponent.create(function ($$) {
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

  test('Should wipe a referenced component when class changes', t => {
    class ComponentA extends TestComponent {
      render ($$) {
        return $$('div').addClass('component-a')
      }
    }
    class ComponentB extends TestComponent {
      render ($$) {
        return $$('div').addClass('component-b')
      }
    }
    class MainComponent extends TestComponent {
      render ($$) {
        let el = $$('div').addClass('context')
        let ComponentClass
        if (this.props.context === 'A') {
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

  test('Should store refs always on owners', t => {
    class MyComponent extends TestComponent {
      render ($$) {
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

  test('Implicitly retain elements when grandchild elements have refs.', t => {
    let comp = TestComponent.create(function ($$) {
      return $$('div').append(
        $$('div').append(
          $$('div').ref(this.props.grandChildRef) // eslint-disable-line no-invalid-this
        )
      )
    }, { grandChildRef: 'foo' })

    let child = comp.getChildAt(0)
    comp.rerender()
    t.ok(child === comp.getChildAt(0), 'Child should be retained.')
    t.ok(child.el === comp.getChildAt(0).el, 'Child element should be retained.')
    t.end()
  })

  test('Implicitly retain elements when passing grandchild with ref.', t => {
    class Child extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('div').append(this.props.children)
        )
      }
    }

    let comp = TestComponent.create(function ($$) {
      let grandchild = $$('div').ref('grandchild')
      return $$('div').append(
        $$(Child).append(grandchild)
      )
    })

    let child = comp.getChildAt(0)
    comp.rerender()
    t.ok(child === comp.getChildAt(0), 'Child should be retained.')
    t.ok(child.el === comp.getChildAt(0).el, 'Child element should be retained.')
    t.end()
  })

  // In ScrollPane we provied a link into the Srollbar which accesses
  // ScrollPanes ref in didUpdate()
  // This is working fine when didUpdate() is called at the right time,
  // i.e., when ScrollPane has been rendered already
  test('Everthing should be rendered when didUpdate() is triggered.', t => {
    let parentIsUpdated = false
    class Parent extends Component {
      render ($$) {
        return $$('div').append(
          $$(Child, {parent: this}).ref('child')
        )
      }
    }
    class Child extends Component {
      render ($$) {
        return $$('div')
      }
      didUpdate () {
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

  test('Updating classes and attributes.', t => {
    class MyComponent extends Component {
      render ($$) {
        let el = $$('div')
        if (this.props.foo) el.setAttribute('data-foo', 'true')
        if (this.props.foo) el.addClass('sm-foo')
        return el
      }
    }
    let comp = MyComponent.render()
    t.notOk(comp.el.hasClass('sm-foo'), 'component should not have class set.')
    t.notOk(comp.el.getAttribute('data-foo'), 'component should not have attribute set.')
    comp.setProps({ foo: true })
    t.ok(comp.el.hasClass('sm-foo'), 'component should have class set.')
    t.ok(comp.el.getAttribute('data-foo'), 'component should have attribute set.')
    comp.setProps({})
    t.notOk(comp.el.hasClass('sm-foo'), 'component should not have class set.')
    t.notOk(comp.el.getAttribute('data-foo'), 'component should not have attribute set.')
    t.end()
  })

  /* ##################### Integration tests / Issues ########################## */

  test('Preserve components when ref matches and rerender when props changed', t => {
    class ItemComponent extends TestComponent {
      shouldRerender (nextProps) {
        return !isEqual(nextProps, this.props)
      }
      render ($$) {
        return $$('div').append(this.props.name)
      }
    }
    class CompositeComponent extends TestComponent {
      render ($$) {
        let el = $$('div').addClass('composite-component')
        this.props.items.forEach(function (item) {
          el.append($$(ItemComponent, {name: item.name}).ref(item.ref))
        })
        return el
      }
    }

    t.comment('Initial mount...')
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

    // Update that should preserve some components, drops some one, and adds two new ones
    t.comment('Changing the layout...')
    comp.setProps({
      items: [
        {ref: 'a', name: 'X'}, // preserved (props changed)
        {ref: 'd', name: 'Y'}, // new
        {ref: 'b', name: 'B'}, // preserved (same props)
        {ref: 'e', name: 'Z'} // new
      ]
    })

    childNodes = comp.childNodes
    t.equal(childNodes.length, 4, 'Component should have 4 children.')
    // a and b should have been preserved
    t.equal(a, comp.refs.a, '.. a should be the same instance')
    t.equal(b, comp.refs.b, '.. b should be the same instance')
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

  // Note: this test was taken from an issue in Lens that I could not manage to sort out
  // TODO: try to split into useful smaller pieces.
  test("[Unspecific] ref'd component must be retained", t => {
    class ComponentWithRefs extends Component {
      getInitialState () {
        return {contextId: 'hello'}
      }
      render ($$) {
        let el = $$('div')
        let workspace = $$('div').ref('workspace').append(
          $$('div').ref('main').append(
            $$(Simple).ref('toolbar').append($$(Simple)),
            $$(Simple).ref('contentPanel').append(
              $$(Simple).ref('coverEditor'),
              $$('div').ref('content').append(
                $$(Simple).ref('mainEditor')
              ),
              $$(Simple).ref('bib')
            )
          ),
          // NOTE: this one is varying
          $$(Simple).ref(this.state.contextId)
        )
        el.append(workspace)
        el.append(
          $$(Simple, {}).ref('statusBar')
        )
        return el
      }
    }

    let comp = ComponentWithRefs.render()
    t.ok(comp.refs.contentPanel, 'There should be a ref to the contentPanel component')
    comp.setState({contextId: 'foo'})
    t.ok(comp.refs.contentPanel, 'There should still be a ref to the contentPanel component')
    comp.setState({contextId: 'bar'})
    t.ok(comp.refs.contentPanel, 'There should still be a ref to the contentPanel component')
    comp.setState({contextId: 'baz'})
    t.ok(comp.refs.contentPanel, 'There should still be a ref to the contentPanel component')
    t.end()
  })

  test('refs should be bound to the owner, not to the parent (#312)', t => {
    class Child extends TestComponent {
      render ($$) {
        return $$('div').append(this.props.children)
      }
    }
    class Parent extends TestComponent {
      render ($$) {
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

  test('Relocating a preserved component (#635)', t => {
    class Parent extends TestComponent {
      render ($$) {
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
    t.equal(comp.el.textContent, 'XYZ', '... and content should be correct.')
    comp.setProps({ nested: true })
    t.equal(comp.refs.foo.getParent().getParent(), comp, "Then 'foo' should be grand-child.")
    t.equal(comp.el.textContent, 'XYZ', '... and content should be correct.')
    comp.setProps({})
    t.equal(comp.refs.foo.getParent(), comp, "At last 'foo' should be direct child again.")
    t.equal(comp.el.textContent, 'XYZ', '... and content should be correct.')
    t.end()
  })

  test('Combine props and children via append', t => {
    class Toolbar extends TestComponent {
      render ($$) {
        let el = $$('div').append(
          $$(Simple, this.props.strong).append('Strong')
        )
        return el
      }
    }

    let toolState = {strong: {active: true}}
    Toolbar.render(toolState)
    // the original toolState object should not have been changed
    t.ok(isEqual(toolState, {strong: {active: true}}), 'props object should not have been touched')
    t.end()
  })

  test('Pass-through props and add children via append', t => {
    class MyComponent extends TestComponent {
      render ($$) {
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
    t.equal(simple.props.foo, props.foo, '.. with props passed through')
    t.equal(simple.props.children.length, 1, '.. with props.children having one element')
    t.equal(simple.textContent, 'Child 1', '.. with correct text content')
    t.end()
  })

  test('Disposing nested components (#1070)', (t) => {
    let registry = {}

    class Surface extends TestComponent {
      didMount () {
        registry[this.props.id] = this
      }
      dispose () {
        delete registry[this.props.id]
      }
      render ($$) {
        return $$('div').addClass('surface')
      }
    }
    class Parent extends TestComponent {
      render ($$) {
        let el = $$('div')
        this.props.ids.forEach((id) => {
          el.append($$('div').append(
            $$(Surface, { id }).ref(id)
          ))
        })
        return el
      }
    }
    let comp = Parent.mount({ ids: ['foo', 'bar'] }, getMountPoint(t))
    t.equal(Object.keys(registry).length, 2, 'There should be 2 surfaces registered.')
    comp.setProps({ ids: ['bar'] })
    t.isNil(registry['foo'], 'Surface "foo" should have been disposed.')
    t.ok(registry['bar'], '.. and surface "bar" should still be there.')
    t.end()
  })

  // Note: this test revealed a problem with debug rendering where the RenderingEngine
  // threw an error because the injected components were not captured
  // but only if the middle component decided not to render the injected components
  test('[Passing Element] Rerendering a component with injected children', t => {
    class GrandParent extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-grand-parent').append(
          $$(Parent).append(
            $$(Child).ref('grandChild')
          ).ref('child')
        )
      }
    }
    class Parent extends TestComponent {
      render ($$) {
        let el = $$('div').addClass('sc-parent')
        if (this.props.show) {
          el.append($$('div').ref('label').text('parent'))
          el.append(this.props.children)
        }
        return el
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child')
      }
    }
    let grandParent = GrandParent.render()
    let parent = grandParent.refs.child
    parent.extendProps({ show: true })
    t.notNil(grandParent.find('.sc-child'), 'The grand-child should be rendered')
    t.end()
  })

  test('[Forwarding Component] rendering a forwarding component', (t) => {
    class Parent extends Component {
      render ($$) {
        return $$('div').append(
          $$(Forwarding).ref('forwarding')
        )
      }
    }
    class Forwarding extends TestComponent {
      render ($$) {
        return $$(Child)
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('my-component').append('Foo')
      }
    }
    let parent = Parent.mount({}, getMountPoint(t))
    let forwarding = parent.refs.forwarding
    t.ok(forwarding.isMounted(), 'The forwarding component should be mounted')
    t.equal(forwarding.didMount.callCount, 1, '.. didMount() should have been called')
    t.ok(forwarding.el.hasClass('my-component'), '.. should render the forwarded components element')
    t.equal(forwarding.el.textContent, 'Foo', '.. and it should have correct content')
    t.end()
  })

  test('[Forwarding Component] Using refs in forwarding components', (t) => {
    class MyComponent extends TestComponent {
      render ($$) {
        return $$('div').addClass('my-component').append('Foo')
      }
    }
    class Forwarding extends TestComponent {
      render ($$) {
        return $$(MyComponent).ref('foo')
      }
    }
    let comp = Forwarding.mount({}, getMountPoint(t))
    let foo = comp.refs.foo
    t.notNil(foo, 'The forwarding component should be have a ref to the child component')
    comp.rerender()
    t.isEqual(comp.refs.foo, foo, 'The forwarded component should be persisted during rerender')
    t.end()
  })

  test('[Forwarding Component] Handling actions from forwarded components', (t) => {
    let _foo = null

    class MyComponent extends TestComponent {
      didMount () {
        this.send('foo')
      }
      render ($$) {
        return $$('div')
      }
    }
    class Forwarding extends TestComponent {
      constructor (...args) {
        super(...args)

        this.handleActions({
          foo () {
            _foo = true
          }
        })
      }

      render ($$) {
        return $$(MyComponent).ref('foo')
      }
    }
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append($$(Forwarding))
      }
    }
    Parent.mount({}, getMountPoint(t))
    t.ok(_foo, 'The action should have been handled')
    t.end()
  })

  test('[Forwarding Component] Handling actions from forwarded components (2)', (t) => {
    let _foo = null

    class MyComponent extends TestComponent {
      didMount () {
        this.send('foo')
      }
      render ($$) {
        return $$('div')
      }
    }
    class Forwarding extends TestComponent {
      constructor (...args) {
        super(...args)

        this.handleActions({
          foo () {
            _foo = true
          }
        })
      }

      render ($$) {
        return $$(MyComponent).ref('foo')
      }
    }
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append($$(Forwarding))
      }
    }
    Parent.mount({}, getMountPoint(t))
    t.ok(_foo, 'The action should have been handled')
    t.end()
  })

  // Note: this test revealed a problem with debug rendering where
  // forwarded children do not get updated correctly
  test('[Forwarding Component] injected children that are forwarding components', t => {
    class GrandParent extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-grand-parent').append(
          $$(Parent).append(
            $$(Child, { mode: this.props.mode }).ref('grandChild')
          ).ref('child')
        )
      }
    }
    class Parent extends TestComponent {
      render ($$) {
        let el = $$('div').addClass('sc-parent')
        el.append($$('div').ref('label').text('parent'))
        el.append(this.props.children)
        return el
      }
    }
    class Child extends TestComponent {
      render ($$) {
        if (this.props.mode === 'b') {
          return $$(ChildB)
        } else {
          return $$(ChildA)
        }
      }
    }
    class ChildA extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child-a')
      }
    }
    class ChildB extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child-b')
      }
    }
    let grandParent = GrandParent.render()
    let parent = grandParent.refs.child
    // Note: the Child Component instance is forwarding to another class
    // still, the ref points to this instance, while in the DOM there is no element of it
    let grandChild = grandParent.refs.grandChild
    t.comment('rerendering parent...')
    parent.rerender()
    t.equal(grandChild.dispose.callCount, 0, 'forwarding component should have been preserved')
    let childA = grandParent.find('.sc-child-a')
    t.equal(grandChild.el, childA.el, 'the forwarding component inherits the element from the forwarded component')
    t.comment('rerendering grand parent with changed props...')
    grandParent.setProps({ mode: 'b' })
    t.equal(childA.dispose.callCount, 1, 'the original forwarded component should have been disposed')
    t.ok(Boolean(grandParent.find('.sc-child-b')), 'and replaced with a different forwarded component')
    t.comment('rerendering grand child with changed props...')
    grandChild.setProps({ mode: 'a' })
    t.ok(grandChild.el.hasClass('sc-child-a'), 'grand child should have the correct element')
    t.end()
  })

  // Note: this test revealed a problem with debug rendering where
  // forwarded children do not get updated correctly
  test("[Forwarding Component] injected children that are forwarding components with ref'd content", t => {
    class GrandParent extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-grand-parent').append(
          $$(Parent).append(
            $$(Child, { mode: this.props.mode }).ref('grandChild')
          ).ref('child')
        )
      }
    }
    class Parent extends TestComponent {
      render ($$) {
        let el = $$('div').addClass('sc-parent')
        el.append($$('div').ref('label').text('parent'))
        el.append(this.props.children)
        return el
      }
    }
    class Child extends TestComponent {
      render ($$) {
        if (this.props.mode === 'b') {
          return $$(ChildB)
        } else {
          return $$(ChildA)
        }
      }
    }
    class ChildA extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child-a')
      }
    }
    class ChildB extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child-b')
      }
    }
    let grandParent = GrandParent.render()
    let parent = grandParent.refs.child
    // Note: the Child Component instance is forwarding to another class
    // still, the ref points to this instance, while in the DOM there is no element of it
    let grandChild = grandParent.refs.grandChild
    t.comment('rerendering parent...')
    parent.rerender()
    t.equal(grandChild.dispose.callCount, 0, 'forwarding component should have been preserved')
    let childA = grandParent.find('.sc-child-a')
    t.equal(grandChild.el, childA.el, 'the forwarding component inherits the element from the forwarded component')
    t.comment('rerendering grand parent with changed props...')
    grandParent.setProps({ mode: 'b' })
    t.equal(childA.dispose.callCount, 1, 'the original forwarded component should have been disposed')
    t.ok(Boolean(grandParent.find('.sc-child-b')), 'and replaced with a different forwarded component')
    t.comment('rerendering grand child with changed props...')
    grandChild.setProps({ mode: 'a' })
    t.ok(grandChild.el.hasClass('sc-child-a'), 'grand child should have the correct element')
    t.end()
  })

  test('[Forwarding Component] mixing regular and forwarding children without refs', t => {
    class Parent extends TestComponent {
      render ($$) {
        let el = $$('div').addClass('sc-parent')
        el.append($$(ChildA))
        if (this.props.mode === 1) {
          el.append($$(ChildB))
        } else {
          el.append($$(ChildC))
        }
        return el
      }
    }
    class ChildA extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child-a')
      }
    }
    class ChildB extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child-b')
      }
    }
    class ChildC extends TestComponent {
      render ($$) {
        return $$(ChildB)
      }
    }
    let parent = Parent.render({ mode: 1 })
    let forwarded = parent.getChildAt(1)
    parent.setProps({ mode: 2 })
    t.equal(forwarded.dispose.callCount, 1, 'childB should have been disposed')
    forwarded = parent.getChildAt(1)
    // ATTENTION: ATM, there is no way to 'see' the forwarding component other than going back via 'parent' of the forwarded component
    let forwarding = forwarded.parent
    parent.setProps({ mode: 1 })
    // NOTE: important is that not only the forwarded component is disposed, but also the forwarding component
    t.equal(forwarding.dispose.callCount, 1, 'childC should have been disposed')
    t.equal(forwarded.dispose.callCount, 1, 'childB forwarded by childC should have been disposed')
    t.end()
  })

  test('[Forwarding Component] updating attributes of a forwarded component', t => {
    class Parent extends TestComponent {
      render ($$) {
        let el = $$(Child)
        if (this.props.mode === 1) {
          el.attr('disabled', true)
        }
        return el
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child')
      }
    }
    let parent = Parent.render({ mode: 0 })
    parent.setProps({ mode: 1 })
    t.ok(parent.el.hasAttribute('disabled'), 'forwarded element should have attribute "disabled"')
    parent.setProps({ mode: 0 })
    t.notOk(parent.el.hasAttribute('disabled'), 'forwarded element should not have attribute "disabled"')
    t.end()
  })

  test('[Forwarding Component] rerendering an injected component', t => {
    // three layers of components, where the grandparent injects the child
    // via props into the parent. Then two consecutive re-renderings were done
    // first on the child level, then on the parent level.
    // The injected components must be captured recursively,
    class GrandParent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Parent, {
            child: $$(Child, {
              model: this.props.model
            })
          }).ref('parent')
        )
      }
    }
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          this.props.child
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child').append(
          this.props.model.map(item => $$('div').ref(item.id).addClass('sc-item').attr('data-id', item.id))
        )
      }
    }
    let model = [{ id: 'foo' }]
    let grandParent = GrandParent.render({ model })
    let parent = grandParent.refs.parent
    let child = grandParent.find('.sc-child')
    model.push({ id: 'bar' })
    t.comment('Rerendering child...')
    child.rerender()
    t.equal(grandParent.findAll('.sc-item').length, 2, 'there should be two items')
    t.comment('Rerendering parent...')
    parent.rerender()
    t.equal(grandParent.findAll('.sc-item').length, 2, 'there should be two items')
    t.end()
  })

  // similar to previous test, but additionally uses a forwarding component on the third level
  test('[Forwarding Component] rerendering an injected and forwarding component', t => {
    class GrandParent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Parent, {
            child: $$(Child, {
              model: this.props.model
            })
          }).ref('parent')
        )
      }
    }
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          this.props.child
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$(Forwarded, { model: this.props.model })
      }
    }
    class Forwarded extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child').append(
          this.props.model.map(item => $$('div').ref(item.id).addClass('sc-item').attr('data-id', item.id))
        )
      }
    }
    let model = [{ id: 'foo' }]
    let grandParent = GrandParent.render({ model })
    let parent = grandParent.refs.parent
    let forwarded = grandParent.find('.sc-child')
    model.push({ id: 'bar' })
    t.comment('Rerendering child...')
    forwarded.rerender()
    t.equal(grandParent.findAll('.sc-item').length, 2, 'there should be two items')
    t.comment('Rerendering parent...')
    parent.rerender()
    t.equal(grandParent.findAll('.sc-item').length, 2, 'there should be two items')
    t.end()
  })

  test('[Preserving] components that do not change the structure preserve child components', t => {
    class MyComponent extends Component {
      render ($$) {
        return $$('div').append(
          $$('div').addClass('foo'),
          $$(Simple).addClass('a'),
          $$(Simple).addClass('b'),
          $$('div').addClass('bar').append(
            $$(Simple).addClass('c'),
            $$(Simple).addClass('d')
          )
        )
      }
    }
    let comp = MyComponent.render()
    let expected = comp.find('.sc-simple')
    comp.rerender()
    let actual = comp.find('.sc-simple')
    t.ok(isArrayEqual(expected, actual), 'all children should have been preserved')
    t.end()
  })
}
