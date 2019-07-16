import { spy } from 'substance-test'
import { Component } from 'substance'

export default class TestComponent extends Component {
  constructor (...args) {
    super(...args)
    this._enableSpies()
  }

  _enableSpies () {
    ['didMount', 'didUpdate', 'dispose', 'shouldRerender', 'render'].forEach((name) => {
      spy(this, name)
    })
  }

  _disableSpies () {
    ['didMount', 'didUpdate', 'dispose', 'shouldRerender', 'render'].forEach((name) => {
      this[name].restore()
    })
  }

  static create (renderFunc, props) {
    const comp = new TestComponent(null, props)
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

  static get Simple () { return SimpleComponent }
}

class SimpleComponent extends TestComponent {
  render ($$) {
    var el = $$('div').addClass('simple')
    if (this.props.children) {
      el.append(this.props.children)
    }
    return el
  }
}
