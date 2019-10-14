import { Component, $$ } from '../dom'

const _ManagedComponentCache = new Map()

/**
 * Example:
 * ```
 * $$(Managed(Toolbar), { bindings: ['commandState'] })
 * ```
 * `commandStates` will be taken from the app-state, and merged with the other props.
 * When `commandStates` is changed, Toolbar automatically will be rerendered automatically via extendProps.
 *
 */
export default function Managed (ComponentClass, ...bindings) {
  if (_ManagedComponentCache.has(ComponentClass)) return _ManagedComponentCache.get(ComponentClass)

  // an anonymous class that takes care of mapping props that start with $
  class ManagedComponent extends Component {
    constructor (...args) {
      super(...args)

      if (!this.context.editorState) {
        throw new Error("'context.editorState' is required for Managed Components.")
      }
      this._config = this._compileManagedProps(bindings)
      this._props = this._deriveManagedProps(this.props)
    }

    didMount () {
      if (this._config) {
        this._register()
      }
    }

    dispose () {
      this.context.editorState.off(this)
    }

    render () {
      return $$(ComponentClass, this._props).ref('managed')
    }

    _register () {
      const { stage, bindings } = this._config
      this.context.editorState.addObserver(bindings, this._onUpdate, this, { stage })
    }

    _deregister () {
      this.context.editorState.off(this)
    }

    _onUpdate () {
      this._props = this._deriveManagedProps()
      this.refs.managed.extendProps(this._props)
    }

    _compileManagedProps (bindings) {
      const stage = 'render'
      if (bindings.length > 0) {
        return { stage, bindings }
      } else {
        return null
      }
    }

    _deriveManagedProps (props) {
      const editorState = this.context.editorState
      const config = this._config
      if (config) {
        const derivedProps = Object.assign({}, props)
        delete derivedProps.bindings
        config.bindings.forEach(binding => {
          // warning: this will be a problem for mangling
          derivedProps[binding] = editorState._get(binding)
        })
        return derivedProps
      } else {
        return props
      }
    }
  }

  _ManagedComponentCache.set(ComponentClass, ManagedComponent)

  return ManagedComponent
}
