/* eslint-disable no-invalid-this, indent */
import { test as substanceTest } from 'substance-test'
import { substanceGlobals, RenderingEngine, Component } from 'substance'
// import { getMountPoint } from './shared/testHelpers'
import TestComponent from './fixture/TestComponent'

const Simple = TestComponent.Simple
const internal = RenderingEngine._internal

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
  // of ui/RenderingEngine.

  // __isMapped__ is an internal state variable that is used
  // by RenderingEnging to know, that a component can be reused. I.e.,
  // the VirtualComponent has been mapped successfully to a Component

  test('A component with ref is mapped', function (t) {
    let comp = TestComponent.create(function ($$) {
      return $$('div').append($$(Simple).ref('foo'))
    })
    let vc = _capture(comp)
    t.ok(vc._isMapped(vc._content), 'root element should be mapped')
    t.ok(vc._isMapped(vc._getRef('foo')), "'foo' should be mapped")
    t.end()
  })

  // TODO: there are more case related nesting of components
  // and injecting components via props

  // __isRelocated__ is an internal state variable that is used
  // when a reused component has been rendered with a different parent

  test('Detecting relocation when injecting a new parent element', function (t) {
    function _render ($$) {
      let el = $$('div')
      let parent = el
      if (this.props.extraLayer) {
        let middle = $$('div')
        el.append(middle)
        parent = middle
      }
      parent.append($$(Simple).ref('foo'))
      return el
    }
    let comp = TestComponent.create(_render)
    let vc = _capture(comp)
    t.notOk(vc._isRelocated(vc._getRef('foo')), "'foo' is not relocated the first time.")

    comp = TestComponent.create(_render, { extraLayer: false })
    _setProps(comp, { extraLayer: true })
    vc = _capture(comp)
    t.ok(vc._isRelocated(vc._getRef('foo')), "'foo' is relocated the second time.")

    comp = TestComponent.create(_render, { extraLayer: true })
    _setProps(comp, { extraLayer: false })
    vc = _capture(comp)
    t.ok(vc._isRelocated(vc._getRef('foo')), "'foo' is relocated the third time.")

    t.end()
  })

  test('Detecting relocation when injecting components (TextProperty use-case)', function (t) {
    /*
      This simulates a situation found often when rendering a TextProperty.
      Say a text property contains an inline node.
      Regularly, the content looks roughly like this:
      ```
        AAAA<div class="inline-node">BBBB</div>CCCC
      ```
      When selected there is a wrapper around this
      ```
        AAAA<div class='selection'><div>BBBB</div></div>CCCC
      ```
      Adding and removing this selection element leads to a situation
      where the inline node needs to be attached to varying parent
      elements.
    */
    function _render ($$) {
      let el = $$('div')
      let parent = el
      el.append('AAAA')
      if (this.props.extraLayer) {
        let middle = $$(Simple).ref('selection')
        el.append(middle)
        parent = middle
      }
      parent.append($$(Simple).ref('foo').append('BBBB'))
      el.append('CCCC')
      return el
    }
    let comp = TestComponent.create(_render)
    let vc = _capture(comp)
    t.notOk(vc._isRelocated(vc._getRef('foo')), "'foo' is not relocated the first time.")

    comp = TestComponent.create(_render, { extraLayer: false })
    _setProps(comp, { extraLayer: true })
    vc = _capture(comp)
    t.ok(vc._isRelocated(vc._getRef('foo')), "'foo' is relocated the second time.")

    comp = TestComponent.create(_render, { extraLayer: true })
    _setProps(comp, { extraLayer: false })
    vc = _capture(comp)
    t.ok(vc._isRelocated(vc._getRef('foo')), "'foo' is relocated the third time.")

    t.end()
  })

  test('Avoid invalid relocations', t => {
    /*
      This simulates a situation found in Texture with a Template Component.
      Specifically, a input always lost focus when the parent got rerendered.
      The reason was, that mapping was not working properly, and the component was
      considered to be relocated, which has the effect, that the DOM element
      is removed and added, without triggering dispose() and didMount().
    */
    class Parent extends TestComponent {
      render ($$) {
        return $$('div').append(
          $$(Template, {
            content: $$(Child).ref('child'),
            footer: this.props.mode === 1 ? $$('div').text('bar') : null
          })
        )
      }
    }
    class Template extends TestComponent {
      render ($$) {
        return $$('div').append(
          this.props.content,
          this.props.footer
        )
      }
    }
    class Child extends TestComponent {
      render ($$) {
        return $$('div').addClass('sc-child')
      }
    }

    let parent = Parent.render({ mode: 1 })

    // changing the props without triggering rerender
    _setProps(parent, { mode: 2 })
    let vc = _capture(parent)
    t.notOk(vc._isRelocated(vc._getRef('child')), "'child' should not be relocated.")
    t.end()
  })
}

function _capture (comp) {
  let vc = internal._wrap(comp)
  let renderingEngine = Component.createRenderingEngine()
  let state = renderingEngine._createState()
  internal._capture(state, vc, 'force')
  vc._state = state
  vc._isMapped = function (o) { return state.isMapped(o) }
  vc._isRelocated = function (o) { return state.isRelocated(o) }
  vc._getRef = function (ref) { return _getRef(vc, ref) }
  return vc
}

function _getRef (vc, ref) {
  return vc._content._context.refs[ref] || {}
}

function _setProps (comp, props) {
  comp.props = props
  Object.freeze(props)
}
