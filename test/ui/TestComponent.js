import { spy } from 'substance-test'
import Component from '../../ui/Component'
import RenderingEngine from '../../ui/RenderingEngine'

class TestComponent extends Component {

  constructor(...args) {
    super(...args)
    this._enableSpies()
  }

  _enableSpies() {
    ['didMount','didUpdate','dispose','shouldRerender','render'].forEach((name) => {
      spy(this, name)
    })
  }

  _disableSpies() {
    ['didMount','didUpdate','dispose','shouldRerender','render'].forEach((name) => {
      this[name].restore()
    })
  }
}

TestComponent.create = function(renderFunc, props) {
  const renderingEngine = TestComponent.defaultRenderingEngine
  const comp = new TestComponent(null, props, { renderingEngine })
  if (renderFunc) {
    comp.render = renderFunc
  }
  if (props) {
    comp.setProps(props)
  } else {
    comp.rerender()
  }
  return comp
}

class SimpleComponent extends TestComponent {

  render($$) {
    var el = $$('div').addClass('simple-component')
    if (this.props.children) {
      el.append(this.props.children)
    }
    return el
  }
}

TestComponent.Simple = SimpleComponent

TestComponent.defaultRenderingEngine = new RenderingEngine()

export default TestComponent
