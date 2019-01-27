/* eslint-disable no-invalid-this, indent */
import { test as substanceTest } from 'substance-test'
import { substanceGlobals, RenderingEngine, Component } from 'substance'
// import { getMountPoint } from './shared/testHelpers'
import TestComponent from './fixture/TestComponent'

const Simple = TestComponent.Simple
const INTERNAL_API = RenderingEngine._INTERNAL_API
const { CAPTURED, RENDERED, LINKED, TOP_LEVEL_ELEMENT, RELOCATED } = INTERNAL_API

// runs RenderingEngine in regular mode
RenderingEngineTests()

// runs RenderingEngine in debug mode
RenderingEngineTests('debug')

function RenderingEngineTests (debug) {
  const LABEL = 'RenderingEngine' + (debug ? ' [debug-mode]' : '')
  const test = (title, fn) => substanceTest(`${LABEL}: ${title}`, t => {
    // before
    let oldVal = substanceGlobals.DEBUG_RENDERING
    substanceGlobals.DEBUG_RENDERING = Boolean(debug)
    try {
      fn(t)
    } finally {
      // after
      substanceGlobals.DEBUG_RENDERING = oldVal
    }
  })

  // NOTE: this is a set of white-box tests for the internal implementation
  // of RenderingEngine.

  // ##########################################################################
  // Capturing
  // ##########################################################################

  test('capturing a simple element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').attr('data-id', 'foo').addClass('bar').setProperty('value', 'baz')
      }
    }
    let comp = new Foo()
    let { state, vc } = _capture(comp)
    t.ok(_isCaptured(state, vc), 'virtual component should be captured')
    t.equal(vc.tagName, 'div', 'tagName should be captured')
    t.equal(vc.getAttribute('data-id'), 'foo', 'attribute should be captured')
    t.ok(vc.hasClass('bar'), 'class should be captured')
    t.equal(vc.getProperty('value'), 'baz', 'value should be captured')
    t.end()
  })

  test('capturing an element with innerHTML', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').html('<b>TEST</b>')
      }
    }
    let comp = new Foo()
    let { state, vc } = _capture(comp)
    t.ok(_isCaptured(state, vc), 'virtual component should be captured')
    t.ok(vc.hasInnerHTML(), 'virtual component should have innerHTML set')
    t.end()
  })

  test('capturing a nested HTML element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('h1').addClass('foo'),
          $$('p').addClass('bar').append(
            $$('span').addClass('baz')
          )
        )
      }
    }
    let comp = new Foo()
    let { state, vc } = _capture(comp)
    t.ok(_isCaptured(state, vc), 'virtual component should be captured')
    t.equal(vc.getChildCount(), 2, '.. should have two children')
    let [foo, bar] = vc.children
    t.ok(_isCaptured(state, foo), 'first child should be captured')
    t.equal(foo.tagName, 'h1', '.. should have correct tagName')
    t.ok(foo.hasClass('foo'), '.. and correct class')
    t.ok(_isCaptured(state, bar), 'second child should be captured')
    t.equal(bar.tagName, 'p', '.. should have correct tagName')
    t.ok(bar.hasClass('bar'), '.. and correct class')
    t.equal(bar.children.length, 1, '.. and should have one child')
    let baz = bar.getChildAt(0)
    t.ok(_isCaptured(state, baz), 'grand child should be captured')
    t.equal(baz.tagName, 'span', '.. should have correct tagName')
    t.ok(baz.hasClass('baz'), '.. and correct class')
    t.end()
  })

  test('capturing a referenced element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('div').addClass('label').text('Name:'),
          $$('input').attr('type', 'text').ref('input')
        )
      }
    }
    let comp = new Foo()
    let { vc } = _capture(comp)
    let input = vc.getChildAt(1)
    t.equal(_getRef(vc, 'input'), input, 'the referenced element should be accessible via ref')
    t.end()
  })

  test('capturing a nested component', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Simple).addClass('foo')
        )
      }
    }
    let comp = new Foo()
    let { vc, state } = _capture(comp)
    let child = vc.getChildAt(0)
    t.ok(_isCaptured(state, child), 'child should have been captured')
    t.ok(child.hasClass('simple'), '.. with class set by child')
    t.ok(child.hasClass('foo'), '.. and with class set by parent')
    t.equal(child.parent, vc, '.. and with correct parent link')
    t.end()
  })

  test('capturing a forwarding component', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$(Simple).addClass('foo')
      }
    }
    let comp = new Foo()
    let { vc, state } = _capture(comp)
    let forwarded = _getForwarded(vc)
    t.ok(_isCaptured(state, forwarded), 'child should have been captured')
    t.ok(forwarded.hasClass('simple'), '.. with class set by child')
    t.ok(forwarded.hasClass('foo'), '.. and with class set by parent')
    t.equal(forwarded.parent, vc, '.. and with correct parent link')
    t.end()
  })

  test('capturing an injected component', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Child, { content: $$(Simple).addClass('foo').ref('foo') })
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('child').append(
          this.props.content
        )
      }
    }
    let comp = new Parent()
    let { vc, state } = _capture(comp)
    let child = vc.getChildAt(0)
    let injected = _getRef(vc, 'foo')
    t.ok(_isCaptured(state, child), 'child should have been captured')
    t.ok(_isCaptured(state, injected), 'the injected component should have been captured')
    t.ok(injected.hasClass('simple'), '.. with class set by itself')
    t.ok(injected.hasClass('foo'), '.. and with class set by its owner')
    t.equal(injected.parent, child, '.. and with correct parent link')
    t.equal(child.getChildAt(0), injected, '.. and be the first child of its parent')
    t.end()
  })

  test('capturing an injected element with child component', t => {
    class Parent extends Component {
      render ($$) {
        return $$('div').addClass('parent').append(
          $$(Child, {
            children: [
              $$('div').addClass('wrapper').append(
                $$(Grandchild).ref('grandchild')
              )
            ]
          })
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
    let comp = new Parent()
    let { vc, state } = _capture(comp)
    let grandchild = _getRef(vc, 'grandchild')
    t.ok(_isCaptured(state, grandchild), 'grandchild should have been captured')
    t.end()
  })

  test('capturing an injected component that is forwarding', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Child, { content: $$(GrandChild).addClass('foo').ref('foo') })
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('child').append(
          this.props.content
        )
      }
    }
    class GrandChild extends TestComponent {
      render ($$) {
        return $$(Simple).addClass('bla')
      }
    }
    let comp = new Parent()
    let { vc, state } = _capture(comp)
    let child = vc.getChildAt(0)
    let injected = _getRef(vc, 'foo')
    let forwarded = _getForwarded(injected)
    t.ok(_isCaptured(state, child), 'child should have been captured')
    t.ok(_isCaptured(state, injected), 'the injected component should have been captured')
    t.ok(injected.hasClass('foo'), '.. with class set by its owner')
    t.equal(injected.parent, child, '.. with correct parent link')
    t.equal(child.getChildAt(0), injected, '.. should be the first child of its parent')
    t.ok(_isCaptured(state, forwarded), 'the forwarded component should have been captured')
    t.ok(forwarded.hasClass('simple'), '.. with class set by itself')
    t.ok(forwarded.hasClass('bla'), '.. with class set by its owner')
    t.equal(forwarded.parent, injected, '.. and with correct parent link')
    t.end()
  })

  // ##########################################################################
  // Rendering
  // ##########################################################################

  test('rendering a simple element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').attr('data-id', 'foo').addClass('bar').setProperty('value', 'baz')
      }
    }
    let comp = new Foo()
    let { state } = _render(comp)
    t.ok(_isRendered(state, comp), 'component should be rendered')
    t.equal(comp.tagName, 'div', 'tagName should be captured')
    t.equal(comp.getAttribute('data-id'), 'foo', 'attribute should be captured')
    t.ok(comp.hasClass('bar'), 'class should be captured')
    t.equal(comp.getProperty('value'), 'baz', 'value should be captured')
    t.end()
  })

  test('rendering a nested HTML element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('h1').addClass('foo'),
          $$('p').addClass('bar').append(
            $$('span').addClass('baz')
          )
        )
      }
    }
    let comp = new Foo()
    let { state } = _render(comp)
    t.ok(_isRendered(state, comp), 'component should be rendered')
    t.equal(comp.getChildCount(), 2, '.. should have two children')
    let [foo, bar] = comp.getChildren()
    t.ok(_isRendered(state, foo), 'first child should be rendered')
    t.equal(foo.tagName, 'h1', '.. should have correct tagName')
    t.ok(foo.hasClass('foo'), '.. and correct class')
    t.ok(_isRendered(state, bar), 'second child should be rendered')
    t.equal(bar.tagName, 'p', '.. should have correct tagName')
    t.ok(bar.hasClass('bar'), '.. and correct class')
    t.equal(bar.getChildCount(), 1, '.. and should have one child')
    let baz = bar.getChildAt(0)
    t.ok(_isRendered(state, baz), 'grand child should be rendered')
    t.equal(baz.tagName, 'span', '.. should have correct tagName')
    t.ok(baz.hasClass('baz'), '.. and correct class')
    t.end()
  })

  test('rendering a referenced element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('div').addClass('label').text('Name:'),
          $$('input').attr('type', 'text').ref('input')
        )
      }
    }
    let comp = new Foo()
    _render(comp)
    t.equal(comp.refs.input, comp.getChildAt(1), 'the referenced element should be accessible via ref')
    t.end()
  })

  test('rendering a nested component', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Simple).addClass('foo')
        )
      }
    }
    let comp = new Foo()
    let { state } = _render(comp)
    let nested = comp.getChildAt(0)
    t.ok(_isRendered(state, nested), 'nested component should have been rendered')
    t.ok(nested.hasClass('simple'), '.. with class set by child')
    t.ok(nested.hasClass('foo'), '.. and with class set by parent')
    t.equal(nested.getParent(), comp, '.. and with correct parent')
    t.end()
  })

  test('rendering a forwarding component', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$(Simple).addClass('foo')
      }
    }
    let comp = new Foo()
    let { state } = _render(comp)
    let forwarded = _getForwarded(comp)
    t.ok(_isRendered(state, forwarded), 'forwarded component should have been rendered')
    t.ok(forwarded.hasClass('simple'), '.. with class set by child')
    t.ok(forwarded.hasClass('foo'), '.. and with class set by parent')
    t.equal(forwarded.getParent(), comp, '.. and with correct parent link')
    t.end()
  })

  test('rendering an injected component', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Child, { content: $$(Simple).addClass('foo').ref('foo') })
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('child').append(
          this.props.content
        )
      }
    }
    let comp = new Parent()
    let { state } = _render(comp)
    let child = comp.getChildAt(0)
    let injected = comp.refs.foo
    t.ok(_isRendered(state, child), 'child should have been rendered')
    t.ok(_isRendered(state, injected), 'the injected component should have been rendered')
    t.ok(injected.hasClass('simple'), '.. with class set by itself')
    t.ok(injected.hasClass('foo'), '.. and with class set by its owner')
    t.equal(injected.getParent(), child, '.. and with correct parent link')
    t.equal(child.getChildAt(0), injected, '.. and be the first child of its parent')
    t.end()
  })

  test('rendering an injected component that is forwarding', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Child, { content: $$(GrandChild).addClass('foo').ref('foo') })
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('child').append(
          this.props.content
        )
      }
    }
    class GrandChild extends TestComponent {
      render ($$) {
        return $$(Simple).addClass('bla')
      }
    }
    let comp = new Parent()
    let { state } = _render(comp)
    let child = comp.getChildAt(0)
    let injected = comp.refs.foo
    let forwarded = _getForwarded(injected)
    t.ok(_isRendered(state, child), 'child should have been rendered')
    t.ok(_isRendered(state, injected), 'the injected component should have been rendered')
    t.ok(injected.hasClass('foo'), '.. with class set by its owner')
    t.equal(injected.getParent(), child, '.. with correct parent link')
    t.ok(_isRendered(state, forwarded), 'the forwarded component should have been rendered')
    t.ok(forwarded.hasClass('simple'), '.. with class set by itself')
    t.ok(forwarded.hasClass('bla'), '.. with class set by its owner')
    t.equal(forwarded.getParent(), injected, '.. and with correct parent link')
    t.end()
  })

  // ##########################################################################
  // Capturing updates
  // ##########################################################################

  test('capturing updates on a simple element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').attr('data-id', this.props.id).addClass(this.props.classNames).setProperty('value', this.props.value)
      }
    }
    let comp = new Foo()
    _render(comp, { id: 'foo', classNames: 'foo', value: 'foo' })
    let { state, vc } = _capture(comp, { id: 'bar', classNames: 'bar', value: 'bar' })
    t.ok(_isLinked(state, vc), 'virtual component should be linked to real component')
    t.equal(vc.tagName, 'div', 'tagName should be captured')
    t.equal(vc.getAttribute('data-id'), 'bar', 'attribute should be captured')
    t.ok(vc.hasClass('bar'), 'class should be captured')
    t.equal(vc.getProperty('value'), 'bar', 'value should be captured')
    t.end()
  })

  test('capturing updates for a referenced element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('div').addClass('label').text('Name:'),
          $$('input').attr('type', 'text').ref('input').val(this.props.value)
        )
      }
    }
    let comp = new Foo()
    _render(comp, { value: 'foo' })
    let { state, vc } = _capture(comp, { value: 'bar' })
    let vinput = _getRef(vc, 'input')
    t.ok(_isLinked(state, vinput), 'referenced element should be linked')
    t.equal(_getComponent(vinput), comp.refs.input, 'associated component should be the same')
    t.equal(comp.refs.input, comp.getChildAt(1), 'the referenced element should be accessible via ref')
    t.end()
  })

  test('capturing updates for a nested component', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Simple).addClass(this.props.classNames)
        )
      }
    }
    let comp = new Foo()
    _render(comp, { classNames: 'foo' })
    let { state, vc } = _capture(comp, { classNames: 'bar' })
    let nested = vc.getChildAt(0)
    t.ok(_isLinked(state, nested), 'nested component should be linked')
    t.ok(nested.hasClass('bar'), 'update of classNames should be captured')
    t.end()
  })

  test('capturing updates for a forwarding component', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$(Simple).addClass(this.props.classNames)
      }
    }
    let comp = new Foo()
    _render(comp, { classNames: 'foo' })
    let { state, vc } = _capture(comp, { classNames: 'bar' })
    let forwarded = _getForwarded(vc)
    t.ok(_isLinked(state, forwarded), 'forwarded component should be linked')
    t.ok(forwarded.hasClass('bar'), 'update of classNames shoud have been captured')
    t.end()
  })

  test('capturing updates for an injected component', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Child, {
            content: $$(Simple).addClass(this.props.classNames).ref('foo')
          })
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('child').append(
          this.props.content
        )
      }
    }
    let comp = new Parent()
    _render(comp, { classNames: 'foo' })
    let { state, vc } = _capture(comp, { classNames: 'bar' })
    let child = vc.getChildAt(0)
    let injected = _getRef(vc, 'foo')
    t.ok(_isLinked(state, child), 'child should be linked')
    t.ok(_isLinked(state, injected), 'injected component should be linked')
    t.ok(injected.hasClass('bar'), 'update injected component should have been captured')
    t.end()
  })

  test('capturing updates for an injected component that is forwarding', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Child, {
            content: $$(GrandChild, { mode: this.props.mode }).addClass(this.props.classNames).ref('foo')
          })
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('child').append(
          this.props.content
        )
      }
    }
    class GrandChild extends TestComponent {
      render ($$) {
        return $$(Simple).addClass(this.props.mode === 1 ? 'bla' : 'blupp')
      }
    }
    let comp = new Parent()
    _render(comp, { classNames: 'foo', mode: 1 })
    let { state, vc } = _capture(comp, { classNames: 'bar', mode: 2 })
    let child = vc.getChildAt(0)
    let injected = _getRef(vc, 'foo')
    let forwarded = _getForwarded(injected)
    t.ok(_isLinked(state, child), 'child should be linked')
    t.ok(_isLinked(state, injected), 'injected component should be linked')
    t.ok(_isLinked(state, forwarded), 'forwarded component should be linked')
    t.ok(injected.hasClass('bar'), 'update of injected component should have been captured')
    t.ok(forwarded.hasClass('blupp'), 'update of forwarded component should have been captured')
    t.end()
  })

  test('capturing updates for a relocated component', t => {
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
    let comp = new Parent()
    _render(comp, { nested: false })
    let { state, vc } = _capture(comp, { nested: true })
    let relocated = _getRef(vc, 'foo')
    t.ok(state.is(LINKED, relocated), 'referenced component should be linked')
    t.ok(state.is(RELOCATED, relocated), 'relocation should have been detected')
    t.end()
  })

  // ##########################################################################
  // Re-Rendering
  // ##########################################################################

  // ATTENTION: this case is not detected during capturing but
  // applied opportunistically during rendering
  test('rerendering nested HTML with constant structure', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('h1').addClass('foo'),
          $$('p').addClass('bar').append(
            $$('span').addClass('baz')
          )
        )
      }
    }
    let comp = new Foo()
    _render(comp)
    let { state, vc } = _render(comp)
    // all virtual elements should be linked
    let all = [vc, ...vc.children, vc.children[1].children[0]]
    t.ok(all.every(vel => _isLinked(state, vel)), 'all elements should be linked')
    t.end()
  })

  test('rerendering a component with a referenced element', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$('div').addClass('label').text('Name:'),
          $$('input').attr('type', 'text').ref('input').val(this.props.value)
        )
      }
    }
    let comp = new Foo()
    _render(comp, { value: 'foo' })
    let input = comp.refs.input
    _render(comp, { value: 'bar' })
    t.equal(comp.refs.input, input, 'referenced element should be retained')
    t.equal(comp.refs.input.val(), 'bar', 'property of referenced component should have been updated')
    t.end()
  })

  test('rerendering a component with a nested component', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Simple).addClass(this.props.classNames)
        )
      }
    }
    let comp = new Foo()
    _render(comp, { classNames: 'foo' })
    let nested = comp.getChildAt(0)
    _render(comp, { classNames: 'bar' })
    t.equal(comp.getChildAt(0), nested, 'nested component should be retained')
    t.ok(nested.hasClass('bar'), 'nested component should have been updated')
    t.end()
  })

  test('rerendering a forwarding component', t => {
    class Foo extends TestComponent {
      render ($$) {
        return $$(Simple).addClass(this.props.classNames)
      }
    }
    let comp = new Foo()
    _render(comp, { classNames: 'foo' })
    let forwarded = _getForwarded(comp)
    _render(comp, { classNames: 'bar' })
    t.equal(_getForwarded(comp), forwarded, 'forwarded component should have been retained')
    t.ok(forwarded.hasClass('bar'), 'forwarded component shoud have been updated')
    t.end()
  })

  test('rerendering an injected component', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Child, {
            content: $$(Simple).addClass(this.props.classNames).ref('foo')
          })
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('child').append(
          this.props.content
        )
      }
    }
    let comp = new Parent()
    _render(comp, { classNames: 'foo' })
    let child = comp.getChildAt(0)
    let injected = comp.refs.foo
    _render(comp, { classNames: 'bar' })
    t.equal(comp.getChildAt(0), child, 'child should have been retained')
    t.ok(comp.refs.foo, injected, 'injected component should have been retained')
    t.ok(injected.hasClass('bar'), 'injected component should have been updated')
    t.end()
  })

  test('rerendering an injected component that is forwarding', t => {
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Child, {
            content: $$(GrandChild, { mode: this.props.mode }).addClass(this.props.classNames).ref('foo')
          })
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('child').append(
          this.props.content
        )
      }
    }
    class GrandChild extends TestComponent {
      render ($$) {
        return $$(Simple).addClass(this.props.mode === 1 ? 'bla' : 'blupp')
      }
    }
    let comp = new Parent()
    _render(comp, { classNames: 'foo', mode: 1 })
    let child = comp.getChildAt(0)
    let injected = _getRef(comp, 'foo')
    let forwarded = _getForwarded(injected)
    _render(comp, { classNames: 'bar', mode: 2 })
    let child2 = comp.getChildAt(0)
    let injected2 = _getRef(comp, 'foo')
    let forwarded2 = _getForwarded(injected2)
    t.equal(child2, child, 'child should have been retained')
    t.equal(injected2, injected, 'injected component should have been retained')
    t.equal(forwarded2, forwarded, 'forwarded component should have been retained')
    t.ok(injected.hasClass('bar'), 'injected component should have been updated')
    t.ok(forwarded.hasClass('blupp'), 'forwarded component should have been updated')
    t.end()
  })

  // NOTE: a component is re-captured typically for rerendering.
  // It is important here, that the existing component is re-used correctly,
  // i.e. virtual elements have to be linked to real components.

  // test('Detecting relocation when injecting a new parent element', function (t) {
  //   function _render ($$) {
  //     let el = $$('div')
  //     let parent = el
  //     if (this.props.extraLayer) {
  //       let middle = $$('div')
  //       el.append(middle)
  //       parent = middle
  //     }
  //     parent.append($$(Simple).ref('foo'))
  //     return el
  //   }
  //   let comp = TestComponent.create(_render)
  //   let vc = _capture(comp)
  //   t.notOk(vc._isRelocated(vc._getRef('foo')), "'foo' is not relocated the first time.")

  //   comp = TestComponent.create(_render, { extraLayer: false })
  //   _setProps(comp, { extraLayer: true })
  //   vc = _capture(comp)
  //   t.ok(vc._isRelocated(vc._getRef('foo')), "'foo' is relocated the second time.")

  //   comp = TestComponent.create(_render, { extraLayer: true })
  //   _setProps(comp, { extraLayer: false })
  //   vc = _capture(comp)
  //   t.ok(vc._isRelocated(vc._getRef('foo')), "'foo' is relocated the third time.")

  //   t.end()
  // })

  // test('Detecting relocation when injecting components (TextProperty use-case)', function (t) {
  //   /*
  //     This simulates a situation found often when rendering a TextProperty.
  //     Say a text property contains an inline node.
  //     Regularly, the content looks roughly like this:
  //     ```
  //       AAAA<div class="inline-node">BBBB</div>CCCC
  //     ```
  //     When selected there is a wrapper around this
  //     ```
  //       AAAA<div class='selection'><div>BBBB</div></div>CCCC
  //     ```
  //     Adding and removing this selection element leads to a situation
  //     where the inline node needs to be attached to varying parent
  //     elements.
  //   */
  //   function _render ($$) {
  //     let el = $$('div')
  //     let parent = el
  //     el.append('AAAA')
  //     if (this.props.extraLayer) {
  //       let middle = $$(Simple).ref('selection')
  //       el.append(middle)
  //       parent = middle
  //     }
  //     parent.append($$(Simple).ref('foo').append('BBBB'))
  //     el.append('CCCC')
  //     return el
  //   }
  //   let comp = TestComponent.create(_render)
  //   let vc = _capture(comp)
  //   t.notOk(vc._isRelocated(vc._getRef('foo')), "'foo' is not relocated the first time.")

  //   comp = TestComponent.create(_render, { extraLayer: false })
  //   _setProps(comp, { extraLayer: true })
  //   vc = _capture(comp)
  //   t.ok(vc._isRelocated(vc._getRef('foo')), "'foo' is relocated the second time.")

  //   comp = TestComponent.create(_render, { extraLayer: true })
  //   _setProps(comp, { extraLayer: false })
  //   vc = _capture(comp)
  //   t.ok(vc._isRelocated(vc._getRef('foo')), "'foo' is relocated the third time.")

  //   t.end()
  // })

//   test('Avoid invalid relocations', t => {
//     /*
//       This simulates a situation found in Texture with a Template Component.
//       Specifically, a input always lost focus when the parent got rerendered.
//       The reason was, that mapping was not working properly, and the component was
//       considered to be relocated, which has the effect, that the DOM element
//       is removed and added, without triggering dispose() and didMount().
//     */
//     class Parent extends TestComponent {
//       render ($$) {
//         return $$('div').append(
//           $$(Template, {
//             content: $$(Child).ref('child'),
//             footer: this.props.mode === 1 ? $$('div').text('bar') : null
//           })
//         )
//       }
//     }
//     class Template extends TestComponent {
//       render ($$) {
//         return $$('div').append(
//           this.props.content,
//           this.props.footer
//         )
//       }
//     }
//     class Child extends TestComponent {
//       render ($$) {
//         return $$('div').addClass('sc-child')
//       }
//     }

//     let parent = Parent.render({ mode: 1 })

//     // changing the props without triggering rerender
//     _setProps(parent, { mode: 2 })
//     let vc = _capture(parent)
//     t.notOk(vc._isRelocated(vc._getRef('child')), "'child' should not be relocated.")
//     t.end()
//   })
}

function _init (comp) {
  let vc = INTERNAL_API._wrap(comp)
  let renderingEngine = Component.createRenderingEngine()
  let state = renderingEngine._createState()
  return { vc, state }
}

function _capture (comp, newProps) {
  let { vc, state } = _init(comp)
  if (newProps) {
    _setProps(comp, newProps)
  }
  INTERNAL_API._capture(state, vc, TOP_LEVEL_ELEMENT)
  return { vc, state }
}

function _render (comp, props) {
  let { vc, state } = _capture(comp, props)
  INTERNAL_API._update(state, vc)
  return { vc, state }
}

function _getRef (comp, ref) {
  if (comp._isVirtualComponent) {
    return comp._context.refs.get(ref)
  } else {
    return comp.refs[ref]
  }
}

function _getComponent (vc) {
  return vc._comp
}

function _isCaptured (state, vc) {
  return state.is(CAPTURED, vc)
}

function _isRendered (state, comp) {
  return state.is(RENDERED, comp)
}

function _isLinked (state, comp) {
  return state.is(LINKED, comp)
}

function _getForwarded (comp) {
  if (comp._isVirtualComponent) {
    return comp.getChildAt(0)
  } else {
    return comp._getForwardedComponent()
  }
}

function _setProps (comp, props) {
  comp.props = props
  Object.freeze(props)
}
