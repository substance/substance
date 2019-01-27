import isFunction from '../util/isFunction'
import uuid from '../util/uuid'
import substanceGlobals from '../util/substanceGlobals'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import VirtualElement from './VirtualElement'

const TOP_LEVEL_ELEMENT = Symbol('TOP_LEVEL_ELEMENT')

/**
 * # Rendering Algorithm
 *
 * ## Introduction
 *
 * What makes our rendering algorithm so difficult?
 *
 * - Dependency Injection requires a (direct) parent to allow constructor
 *   injection, i.e. that injected dependencies are available in the constructor
 *   already. As a consequence a component tree must to be constructed from top
 *   to down.
 *
 * - The earliest time to evaluate `$$(MyComponent)`, is when it has been
 *   attached to an existing component. I.e., to run `MyComponent.render()` an
 *   instance of `MyComponent` is needed, which can only be created with an
 *   existing parent component.
 *
 * - In general, it is *not* possible to have a naturally descending rendering
 *   algorithm, i.e. a simple recursion calling `render()` and creating or
 *   updating Components on the way, preserving a simple stack-trace.
 *   Instead, it requires calling `render()` on one level, then doing comparisons
 *   with the existing tree to be able to reuse components, and then descend into
 *   the sub-tree.
 *
 * - If components are passed down via props, things get even more difficult.
 *   For example, consider a situation where components are passed via props:
 *   ```
 *     render($$) {
 *       return $$('div').append(
 *         $$(Wrapper, {
 *           foo: $$(MyComponent)
 *         })
 *       )
 *     }
 *   ```
 *   At the time when this component gets rendered, `MyComponent` can not be
 *   instantiated, as it is not known what `Wrapper` actually does with it.
 *   While the general approach is working from top-to-down, in this case it has
 *   a bottom-to-up nature, i.e., the child needs to be rendered to know what to
 *   do with the passed component.
 *
 *   Particularly, this is problematic when the passed component has a reference:
 *   ```
 *     render($$) {
 *       return $$('div').append(
 *         $$(Wrapper, {
 *           foo: $$(MyComponent).ref('foo')
 *         })
 *       )
 *     }
 *   ```
 *   As nothing is known at the time of descending about the content of `Wrapper`
 *   the rendering algorithm can not tell that it ought to be preserved. For now,
 *   the correct way to deal with this situation is to use a reference for the
 *   wrapper as well:
 *   ```
 *     render($$) {
 *       return $$('div').append(
 *         $$(Wrapper, {
 *           foo: $$(MyComponent).ref('foo')
 *         }).ref('wrapper')
 *       )
 *     }
 *   ```
 *
 * ## Algorithm
 *
 * For a given Component `comp`:
 *
 * 1. Capturing a virtual DOM
 *   1.1. Create a virtual DOM element by calling `comp.render()`
 *   1.2. Map virtual elements to existing elements
 *   1.3. Apply 1.1. and 1.2. recursively for every virtual Component
 * 2. Update `comp.el` given a virtual DOM element
 *
 * Notes:
 * - 1.2. is necessary to preserve components and capture DOM updates using the
 *   correct instances
 * - 2. can be seen as an independent task, updating one DOM given a second one.
 *
 * ## Implementation
 *
 * > TODO: flesh this out
 *
 * - Rendering happens in two stages: capture and render/update.
 *   In the capturing stage a VirtualComponent tree is created by calling
 *   `Component.render()` from top to down recursively. In the rendering stage
 *   DOM elements are created and updated.
 * - DEBUG_RENDERING: recursive capturing is best done level by level, i.e.
 *   capture one VirtualComponent, and then descend into the child components.
 *   Unfortunately this detaches one render() call of a parent component from the
 *   `render()` calls of the children component. For this reason, we introduced a
 *   mode where the render() method is used as a vehicle to trigger recursive
 *   capturing.
 *   This would not be necessary if we were using a recursive syntax, as React
 *   does, i.e. the code is more like functional programming.
 *   While this works well for simple scenarios, the source code is getting
 *   harder to read control flow is necessary, e.g. for loops or if statements
 * - Refs: the programmer can use ref(id) to register a reference to a child
 *   component. Referenced components are always reused when rerendering, i.e.
 *   not disposed. For other elements, there is no guarantee that the component
 *   and its DOM element is reused. The RenderingEngine may do so if possible,
 *   e.g. if the structure does not change.
 *
 * ## TODO
 *
 * - reuse unmapped elements that are compatible during rendering
 * - rethink 'Forwarding Components' regarding parent-child relationship.
 *   ATM, there is no extra model for that hierarchy than the DOM, only
 *   `comp.parent` reflects the relationship correctly
 *
 * These ideas could improve the implementation:
 * - remove outlets: outlets are just another way to change props.
 */
export default class RenderingEngine {
  constructor (options = {}) {
    this.componentFactory = options.componentFactory
    if (!this.componentFactory) throw new Error("'componentFactory' is mandatory")
    this.elementFactory = options.elementFactory || DefaultDOMElement.createDocument('html')
    if (!this.elementFactory) throw new Error("'elementFactory' is mandatory")
  }

  _render (comp, oldProps, oldState) {
    if (substanceGlobals.VERBOSE_RENDERING_ENGINE) {
      console.group('RenderingEngine')
      if (!comp.el) {
        console.log('Rendering Engine: initial render of %s', comp.constructor.name)
      } else {
        console.log('Rendering Engine: re-render of %s', comp.constructor.name)
      }
      console.time('rendering (total)')
    }
    let vel = _createWrappingVirtualComponent(comp)
    let state = this._createState()
    if (oldProps) {
      state.set(OLDPROPS, vel, oldProps)
    }
    if (oldState) {
      state.set(OLDSTATE, vel, oldState)
    }
    try {
      if (substanceGlobals.VERBOSE_RENDERING_ENGINE) {
        console.time('capturing')
      }
      // capture: this calls the render() method of components, creating a virtual DOM
      _capture(state, vel, TOP_LEVEL_ELEMENT)
      if (substanceGlobals.VERBOSE_RENDERING_ENGINE) {
        console.timeEnd('capturing')
      }

      if (substanceGlobals.VERBOSE_RENDERING_ENGINE) {
        console.time('updating')
      }
      _update(state, vel)
      if (substanceGlobals.VERBOSE_RENDERING_ENGINE) {
        console.timeEnd('updating')
      }

      _triggerDidUpdate(state, vel)
    } finally {
      if (substanceGlobals.VERBOSE_RENDERING_ENGINE) {
        console.timeEnd('rendering (total)')
        console.groupEnd('RenderingEngine')
      }
      state.dispose()
    }
  }

  // this is used together with the incremental Component API
  // TODO: we could try to generalize this to allow partial rerenderings
  // e.g. a component has a method to rerender just one element, which is then
  // applied to update an element
  _renderChild (comp, vel) {
    // HACK: to make this work with the rest of the implementation
    // we ingest a fake parent
    let state = this._createState()
    vel.parent = { _comp: comp, _isFake: true }
    try {
      _capture(state, vel)
      _update(state, vel)
      return vel._comp
    } finally {
      state.dispose()
    }
  }

  _createState () {
    return new RenderingState(this.componentFactory, this.elementFactory)
  }

  static createContext (comp) {
    let vel = _createWrappingVirtualComponent(comp)
    return new VirtualElement.Context(vel)
  }
}

// calling comp.render() and capturing recursively
function _capture (state, vel, mode) {
  if (state.is(CAPTURED, vel)) {
    return vel
  }
  // a captured VirtualElement has a component instance attached
  let comp = vel._comp
  if (!comp) {
    comp = _create(state, vel)
    state.set(NEW, vel)
  }
  if (vel._isVirtualComponent) {
    let needRerender
    // NOTE: forceCapture is used for the first entrance
    // from this.render(comp) where we want to fource capturing
    // as it has already been cleared that a rerender is necessary
    if (mode === TOP_LEVEL_ELEMENT) {
      needRerender = true
      // top-level comp and virtual component are linked per se
      console.assert(vel._comp === comp, 'top-level element and component should be linked already')
      state.set(MAPPED, vel)
      state.set(MAPPED, comp)
      state.set(LINKED, vel)
      state.set(LINKED, comp)
    } else {
      // NOTE: don't ask shouldRerender if no element is there yet
      needRerender = !comp.el || comp.shouldRerender(vel.props, comp.state)
      // Note: in case of VirtualComponents there are typically two actors setting element properties:
      // the component instance itself, and the owner, such as in
      // `$$(Foo).addClass('se-foo')`
      // To be able to retain the element properties set by the parent, we have to bring them out of the way
      // before capturing the component
      vel.elementProps = vel._copy()
      vel._clear()
      state.set(OLDPROPS, vel, comp.props)
      state.set(OLDSTATE, vel, comp.state)
      // updates prop triggering willReceiveProps
      comp._setProps(vel.props)
      if (!state.is(NEW, vel)) {
        state.set(UPDATED, vel)
      }
    }
    if (needRerender) {
      let context = new VirtualElement.Context(vel)
      let content = comp.render(context.$$)
      if (!content) {
        throw new Error('Component.render() returned nil.')
      } else if (content._isVirtualComponent) {
        // allowing for forwarding components
        // content needs to have a parent for creating components
        vel._forwardedEl = content
        vel._isForwarding = true
        content._isForwarded = true
        content.parent = vel
        vel.children = [content]
      } else if (content._isVirtualHTMLElement) {
        // merge the content into the VirtualComponent instance
        vel.tagName = content.tagName
        vel._merge(content)
        if (content.hasInnerHTML()) {
          vel._innerHTMLString = content._innerHTMLString
          vel.children = []
        } else {
          vel.children = content.children
          // adopting the children
          vel.children.forEach(child => {
            child.parent = vel
          })
        }
      } else {
        throw new Error('render() must return a plain element or a Component')
      }
      // retain the rendering context
      vel._context = content._context

      // augmenting the element properties with those given by the owner
      // such as in $$(Foo, { child: $$(Bar).addClass('') })
      if (vel.elementProps) {
        vel._merge(vel.elementProps)
        // augment a forwarded virtual component with the accumlated element properties
        // (works also for injected, forwarding components
        if (vel._isForwarding) {
          vel._forwardedEl._merge(vel)
        }
      }

      // TODO: document what this is used for
      if (!state.is(NEW, vel) && comp.isMounted()) {
        state.set(UPDATED, vel)
      }

      // ATTENTION: before capturing we need to link VirtualComponents with
      // existing Components so that `render()` can be called on the
      // correct instances.
      _forEachComponent(state, comp, vel, _linkComponent)

      // Descending
      if (substanceGlobals.DEBUG_RENDERING) {
        // in this case we use the render() function as iterating function,
        // where `$$` is a function which creates components and renders them
        // recursively. First we can create all element components that can be
        // reached without recursion
        let stack = vel.children.slice(0)
        while (stack.length) {
          let child = stack.shift()
          if (state.is(CAPTURED, child)) continue
          // virtual components are addressed via recursion, not captured here
          if (child._isVirtualComponent) continue
          if (!child._comp) {
            _create(state, child)
          }
          if (child._isVirtualHTMLElement && child.children.length > 0) {
            stack = stack.concat(child.children)
          }
          state.set(CAPTURED, child)
        }
        // then we run comp.render($$) with a special $$ that captures
        // VirtualComponents recursively
        let descendingContext = new DescendingContext(state, context)
        while (descendingContext.hasPendingCaptures()) {
          descendingContext.reset()
          comp.render(descendingContext.$$)
        }
        // capture injected components recursively
        // for the case that the owner is not re-rendered
        for (let child of context.injectedComponents) {
          _capture(state, child)
        }
        // TODO: this can be improved. It would be better if _capture was called
        // by DescendingContext() then the forwarded component would be rendered
        // during the render() call of the forwarding component
        if (vel._forwardedEl) {
          _capture(state, vel._forwardedEl)
        }
      } else {
        // ATTENTION: without DEBUG_RENDERING enabled the content is captured
        // outside of the `render()` call stack i.e. `render()` has finished
        // already and provided a virtual element. Children component are
        // rendered as part of this recursion, i.e. in the stack trace there
        // will be `RenderingEngine._capture()` only
        if (vel._forwardedEl) {
          _capture(state, vel._forwardedEl)
        } else {
          for (let child of vel.children) {
            _capture(state, child)
          }
        }
      }
      _forEachComponent(state, comp, vel, _propagateLinking)
    } else {
      // SKIPPED are those components who have returned `shouldRerender() = false`
      state.set(SKIPPED, vel)
    }
  } else if (vel._isVirtualHTMLElement) {
    for (let child of vel.children) {
      _capture(state, child)
    }
  }

  state.set(CAPTURED, vel)
  return vel
}

// called to initialize a captured component, i.e. creating a Component instance
// from a VirtualElement
function _create (state, vel) {
  let comp = vel._comp
  console.assert(!comp, 'Component instance should not exist when this method is used.')
  let parent = vel.parent._comp
  // making sure the parent components have been instantiated
  if (!parent) {
    parent = _create(state, vel.parent)
  }
  // TODO: probably we should do something with forwarded/forwarding components here?
  if (vel._isVirtualComponent) {
    console.assert(parent, 'A Component should have a parent.')
    comp = state.componentFactory.createComponent(vel.ComponentClass, parent, vel.props)
    // HACK: making sure that we have the right props
    // TODO: instead of HACK add an assertion, and make otherwise sure that vel.props is set correctly
    vel.props = comp.props
    if (vel._forwardedEl) {
      let forwardedEl = vel._forwardedEl
      let forwardedComp = state.componentFactory.createComponent(forwardedEl.ComponentClass, comp, forwardedEl.props)
      // HACK same as before
      forwardedEl.props = forwardedComp.props
      comp._forwardedComp = forwardedComp
    }
  } else if (vel._isVirtualHTMLElement) {
    comp = state.componentFactory.createElementComponent(parent, vel)
  } else if (vel._isVirtualTextNode) {
    comp = state.componentFactory.createTextNodeComponent(parent, vel)
  }
  if (vel._ref) {
    comp._ref = vel._ref
  }
  if (vel._owner) {
    comp._owner = vel._owner._comp
  }
  vel._comp = comp
  return comp
}

/*
  Prepares a new virtual component by comparing it with the old version.

  It sets the _comp references in the new version where its ancestors
  can be mapped to corresponding virtual components in the old version.
*/
function _forEachComponent (state, comp, vc, hook) {
  console.assert(vc._isVirtualComponent, 'this method is intended for VirtualComponents only')
  if (!vc.__components__) {
    let context = vc._context
    console.assert(context, 'there should be a capturing context on the VirtualComponent')
    // refs are those ref'd using $$().ref()
    let newRefs = context.refs
    // foreignRefs are refs of those components which are passed via props
    let newForeignRefs = context.foreignRefs
    // all other components which are not ref'd stored via a derived key based on trace
    if (!context.internalRefs) {
      context.internalRefs = _extractInternalRefs(context, vc)
    }
    let newInternalRefs = context.internalRefs
    let entries = []
    let compData = _getInternalComponentData(comp)
    let oldRefs = compData.refs
    let oldForeignRefs = compData.foreignRefs
    // TODO: make sure that this is always initialized properly
    let oldInternalRefs = compData.internalRefs || new Map()
    let _addEntries = (_newRefs, _oldRefs) => {
      for (let [ref, vc] of _newRefs) {
        let oldVc = _oldRefs.get(ref)
        let comp
        if (oldVc) {
          comp = oldVc._comp
          console.assert(comp, 'virtual component should have a component instance')
        }
        entries.push({ vc, comp })
      }
    }
    if (newRefs.size > 0) _addEntries(newRefs, oldRefs)
    if (newForeignRefs.size > 0) _addEntries(newForeignRefs, oldForeignRefs)
    if (newInternalRefs.size > 0) _addEntries(newInternalRefs, oldInternalRefs)
    vc.__components__ = entries
  }
  if (vc.__components__.length > 0) {
    for (let entry of vc.__components__) {
      hook(state, entry.comp, entry.vc)
    }
  }
}

function _linkComponent (state, comp, vc) {
  // NOTE: comp is undefined if there was no corresponding ref in the previous rendering
  if (!comp) {
    _reject(state, comp, vc)
    return
  }
  if (_isMapped(state, comp, vc)) return
  if (_isLinked(state, comp, vc)) return
  if (_isOfSameType(comp, vc)) {
    _link(state, comp, vc)
  } else {
    _reject(state, comp, vc)
  }
}

function _link (state, comp, vc) {
  vc._comp = comp
  state.set(MAPPED, vc)
  state.set(MAPPED, comp)
  state.set(LINKED, vc)
  state.set(LINKED, comp)
}

function _reject (state, comp, vc) {
  vc._comp = null
  state.set(MAPPED, vc)
  if (comp) state.set(MAPPED, comp)
}

function _isMapped (state, comp, vc) {
  const vcIsMapped = state.is(MAPPED, vc)
  const compIsMapped = state.is(MAPPED, comp)
  if (vcIsMapped || compIsMapped) {
    if (!vcIsMapped) {
      console.error('FIXME: comp is mapped, but not virtual component')
      state.set(MAPPED, vc)
    }
    if (!compIsMapped) {
      console.error('FIXME: comp is mapped, but not virtual component')
      state.set(MAPPED, vc)
    }
    return true
  }
  return false
}

function _isLinked (state, comp, vc) {
  let compIsLinked = state.is(LINKED, comp)
  let vcIsLinked = state.is(LINKED, vc)
  if (vc._comp === comp) {
    if (!vcIsLinked) {
      console.error('FIXME: comp is linked, but not virtual component')
      state.set(LINKED, vc)
    }
    if (!compIsLinked) {
      console.error('FIXME: virtual comp is linked, but not component')
      state.set(LINKED, vc)
    }
    return true
  }
  return false
}

/*
  This tries to map the virtual component to existing component instances
  by looking at the old and new refs, making sure that the element type is
  compatible.
*/
function _propagateLinking (state, comp, vel, stopIfMapped) {
  if (!vel) {
    console.error('DOCUMENT WHY THIS IS NEEDED')
    return false
  }
  // NOTE: comp is undefined if there was no corresponding ref in the previous rendering
  // or when bubbling up to the root component
  if (!comp) {
    return false
  }
  // stopping condition
  if (stopIfMapped && _isMapped(state, comp, vel)) {
    return _isLinked(state, comp, vel)
  }

  // try to link VirtualHTMLElements and VirtualTextElements
  // allowing to retain DOM elements
  if (!vel._isVirtualComponent) {
    if (!_isOfSameType(comp, vel)) {
      _reject(state, comp, vel)
      // stop propagation here
      return false
    } else {
      _link(state, comp, vel)
    }
  }

  // Now we try to map all ancestors. If not possible, then the
  let canLinkParent = false
  let parent = comp.getParent()
  if (vel.parent) {
    canLinkParent = _propagateLinking(state, parent, vel.parent, true)
  // to be able to support implicit retaining of elements
  // we need to propagate mapping through the 'preliminary' parent chain
  // i.e. not taking the real parents as rendered, but the Components into which
  // we have passed children (via vel.append() or vel.outlet().append())
  } else if (vel._preliminaryParent) {
    while (parent && parent._isElementComponent) {
      parent = parent.getParent()
    }
    canLinkParent = _propagateLinking(state, parent, vel._preliminaryParent, true)
  }
  // VirtualComponent that have parents that could not be mapped must have been
  // relocated, i.e. attached to a different parent
  // TODO: discuss if we really want to allow this.
  // Relocation is an edge case, in most cases not desired, and thus if happened
  // more likely to be a problem.
  if (vel._isVirtualComponent && !canLinkParent) {
    if (substanceGlobals.VERBOSE_RENDERING_ENGINE) {
      console.info('Component has been relocated: ' + comp.constructor.name)
    }
    state.set(RELOCATED, vel)
    state.set(RELOCATED, comp)
  }
  return canLinkParent
}

function _isOfSameType (comp, vc) {
  return (
    (comp._isElementComponent && vc._isVirtualHTMLElement) ||
    (comp._isComponent && vc._isVirtualComponent && comp.constructor === vc.ComponentClass) ||
    (comp._isTextNodeComponent && vc._isVirtualTextNode)
  )
}

// Update a DOM element by applying changes derived from a given virtual element
function _update (state, vel) {
  // NOTE: this method might look a bit monstrous because of the rather complex
  // branching structure. However, we want to avoid extra recursion or separation
  // into functions for sake of shorter stack-traces when debugging

  if (state.is(SKIPPED, vel)) return
  // console.log('... rendering', vel._ref)

  let comp = vel._comp

  // HACK: workaround for a problem found in DEBUG_RENDERING mode
  // situation: a grand-parent injects via props a child component into a parent
  // component, which does render the children only in certain states (e.g. showChild=true|false)
  // changing the state from hide to show on the parent component, caused errors here
  // It would be more consistent to do this during the capturing phase of
  // vel._preliminaryParent, i.e. the one that has appends injected component.
  // TODO: decide if this really a HACK
  if (!comp) {
    if (vel._ref && vel._preliminaryParent !== vel._owner) {
      _capture(state, vel)
    }
  }
  console.assert(comp && comp._isComponent, 'A captured VirtualElement must have a component instance attached.')

  // special handling of forwarding elements which don't have their own element
  // but are delegating to their child
  if (vel._isForwarding) {
    _update(state, vel._forwardedEl)
  } else {
    // render the element
    if (!comp.el) {
      comp.el = _createDOMElement(state, vel)
    } else {
      let el = comp.el
      console.assert(el, "Component's element should exist at this point.")
      _updateDOMElement(el, vel)
    }

    // TODO: to allow mounting a prerendered DOM element
    // we would need to allow to 'take ownership' instead of removing
    // the element. This being a special situation, we should only
    // do that when mounting

    // structural updates are necessary only for non-forwarding Components and HTML elements without innerHTML
    if ((vel._isVirtualComponent || vel._isVirtualHTMLElement) && !vel.hasInnerHTML()) {
      let newChildren = vel.children

      // remove all elements from the DOM which are not linked to a component
      // or which we know have been relocated
      // ATTENTION: removing the elements of relocated components
      // in advance, then the algorithm later becomes easier only considering
      // add and remove.
      let _childNodes = comp.el.getChildNodes()
      let oldChildren = _childNodes.map(child => {
        let childComp = child._comp
        // EXPERIMENTAL: trying to get forwarding components right.
        // the problem is that on the DOMElement level, forwarding components are not
        // 'visible', as they do not have an own element.
        // Here we are taking the owner of an element when it isForwarded
        // bubbling up the parent hierarchy.
        if (childComp._isForwarded()) {
          childComp = _findForwardingChildOfComponent(comp, childComp)
        }
        // remove orphaned nodes and relocated components
        if (!childComp || state.is(RELOCATED, childComp)) {
          comp.el.removeChild(child)
          return null
        } else {
          return childComp
        }
      }).filter(Boolean)

      // TODO: it might be easier to understand to separate DOM analysis, i.e.
      // what to do with the DOM, from the actual DOM manipulation.
      // The former could be described as a set of DOM operations, which would then
      // interpreted by the latter
      let pos1 = 0; let pos2 = 0
      while (pos1 < oldChildren.length || pos2 < newChildren.length) {
        let oldComp
        // skip detached components
        // Note: components get detached when preserved nodes
        // are found in a swapped order. Then the only way is
        // to detach one of them from the DOM, and reinsert it later at the new
        // position
        do {
          oldComp = oldChildren[pos1++]
        } while (oldComp && (state.is(DETACHED, oldComp)))

        let newVel = newChildren[pos2++]
        // remove remaining old ones if no new one is left
        if (oldComp && !newVel) {
          while (oldComp) {
            _removeChild(state, comp, oldComp)
            oldComp = oldChildren[pos1++]
          }
          break
        }

        // reuse TextNodes to avoid unnecesary DOM manipulations
        if (oldComp && oldComp.el.isTextNode() &&
            newVel && newVel._isVirtualTextNode &&
            oldComp.el.textContent === newVel.text) {
          continue
        }

        // ATTENTION: here we are linking two HTML elements opportunistically on the fly
        // Note, that !state.is(MAPPED) means that both elements do not contain
        // any refs or components, and are thus save to be reused
        // TODO: we should find out if this is really something we want to do
        // or stick to primitive rendering for sake of performance
        if (oldComp && oldComp._isElementComponent &&
            newVel._isVirtualHTMLElement &&
            !state.is(MAPPED, oldComp) && !state.is(MAPPED, newVel) &&
            oldComp.tagName === newVel.tagName) {
          // linking
          newVel._comp = oldComp
          state.set(LINKED, newVel)
          state.set(LINKED, oldComp)
          _update(state, newVel)
          continue
        }

        // update virtual component recursively
        if (!state.is(RENDERED, newVel)) {
          _update(state, newVel)
        }

        let newComp = newVel._comp
        // nothing more to do if components are equal, i.e. component and virtual component have been linked during capturing
        if (newComp === oldComp) {
          continue
        }
        // update the parent for relocated components
        // ATTENTION: relocating a component does not update its context
        if (state.is(RELOCATED, newComp)) {
          newComp._setParent(comp)
        }
        console.assert(newComp, 'Component instance should now be available.')

        // append remaining new ones if no old one is left
        if (newVel && !oldComp) {
          _appendChild(state, comp, newComp)
          continue
        }

        // Differential update
        if (state.is(LINKED, newVel)) {
          if (state.is(LINKED, oldComp)) {
            // the order of elements with ref has changed
            state.set(DETACHED, oldComp)
            _removeChild(state, comp, oldComp)
            pos2--
          // the old one could not be mapped, thus can be removed
          } else {
            _removeChild(state, comp, oldComp)
            pos2--
          }
        } else if (state.is(LINKED, oldComp)) {
          _insertChildBefore(state, comp, newComp, oldComp)
          pos1--
        } else {
          // both elements are not mapped
          // TODO: we could try to reuse components if they are of same type
          // However, this needs a more involved mapping strategy, and/or a change
          // in the order of this iteration. At this point it is already too late
          // because the recursive update has already been done, not reusing the existing elements
          _replaceChild(state, comp, oldComp, newComp)
        }
      }
    }
  }

  if (vel._isVirtualComponent) {
    _storeInternalData(comp, vel)

    // using the element of the forwarded component as element for this component
    if (vel._forwardedEl) {
      let forwardedComp = vel._forwardedEl._comp
      // TODO: is this really the correct time to call didMount? shouldn't this
      // be called when processed by the parent?
      // TODO: this will not work with multiple forwarded components
      if (!comp.el) {
        comp.el = forwardedComp.el
        // forwardedComp.triggerDidMount()
        // comp.triggerDidMount()
      } else {
        // EXPERIMENTAL: the forwarded comp has been updated
        let oldForwardedComp = comp.el._comp
        if (oldForwardedComp !== forwardedComp) {
          oldForwardedComp.triggerDispose()
          comp.el.parentNode.replaceChild(comp.el, forwardedComp.el)
          comp.el = forwardedComp.el
          forwardedComp.triggerDidMount()
        }
      }
    }
  }

  state.set(RENDERED, vel)
  state.set(RENDERED, comp)
}

function _getInternalComponentData (comp) {
  if (!comp.__internal__) {
    comp.__internal__ = new InternalComponentData()
  }
  return comp.__internal__
}

function _storeInternalData (comp, vc) {
  let context = vc._context
  let compData = _getInternalComponentData(comp)
  compData.elementProps = vc.elementProps
  compData.refs = context.refs
  compData.foreignRefs = context.foreignRefs
  compData.internalRefs = context.internalRefs
  // creating a plain object with refs to real component instances
  comp.refs = Array.from(context.refs).reduce((refs, [key, vc]) => {
    // ATTENTION: in case that a referenced component has not been used,
    // i.e. actually appended to an element, the virtual component will not be rendered
    // thus does not have component instance attached
    let comp = vc._comp
    if (comp) {
      refs[key] = vc._comp
    } else {
      console.warn(`Warning: component with reference '${key}' has not been used`)
    }
    return refs
  }, {})
}

function _extractInternalRefs (context, root) {
  let idCounts = new Map()
  let refs = new Map()
  for (let vc of context.components) {
    // TODO: also skip those components which are not appended to the current comp
    if (vc._ref) continue
    let ref = _getVirtualComponentTrace(vc, root)
    // disambiguate generated refs by appending '@<count>'
    if (idCounts.has(ref)) {
      let count = idCounts.get(ref) + 1
      idCounts.set(ref, count)
      ref = ref + '@' + count
    } else {
      idCounts.set(ref, 1)
    }
    refs.set(ref, vc)
  }
  return refs
}

function _getVirtualComponentTrace (vc, root) {
  let frags = [vc.ComponentClass.name]
  // TODO: is this
  if (!vc._isForwarded) {
    let parent = vc.getParent()
    while (parent) {
      if (parent === root) break
      // HACK: incremental render uses a fake parent
      if (parent._isFake) break
      // ATTENTION if the vc has been appended then its ancestors are all virtual HTML elements
      console.assert(parent._isVirtualHTMLElement)
      frags.unshift(parent.tagName)
      parent = parent.parent
    }
  }
  return frags.join('/')
}

function _triggerDidUpdate (state, vel) {
  if (vel._isVirtualComponent) {
    if (!state.is(SKIPPED, vel)) {
      vel.children.forEach(_triggerDidUpdate.bind(null, state))
    }
    if (state.is(UPDATED, vel)) {
      vel._comp.didUpdate(state.get(OLDPROPS, vel), state.get(OLDSTATE, vel))
    }
  } else if (vel._isVirtualHTMLElement) {
    vel.children.forEach(_triggerDidUpdate.bind(null, state))
  }
}

function _appendChild (state, parent, child) {
  parent.el.appendChild(child.el)
  _triggerDidMount(state, parent, child)
}

function _replaceChild (state, parent, oldChild, newChild) {
  parent.el.replaceChild(oldChild.el, newChild.el)
  if (!state.is(DETACHED, oldChild)) {
    oldChild.triggerDispose()
  }
  _triggerDidMount(state, parent, newChild)
}

function _insertChildBefore (state, parent, child, before) {
  parent.el.insertBefore(child.el, before.el)
  _triggerDidMount(state, parent, child)
}

function _removeChild (state, parent, child) {
  parent.el.removeChild(child.el)
  if (!state.is(DETACHED, child)) {
    child.triggerDispose()
  }
}

function _triggerDidMount (state, parent, child) {
  if (!state.is(DETACHED, child) &&
      parent.isMounted() && !child.isMounted()) {
    child.triggerDidMount(true)
  }
}

function _createDOMElement (state, vel) {
  let el
  if (vel._isVirtualTextNode) {
    el = state.elementFactory.createTextNode(vel.text)
  } else {
    el = state.elementFactory.createElement(vel.tagName)
  }
  if (vel._comp) {
    el._comp = vel._comp
  }
  _updateDOMElement(el, vel)
  return el
}

function _updateDOMElement (el, vel) {
  // special handling for text nodes
  if (vel._isVirtualTextNode) {
    el.setTextContent(vel.text)
    return
  }
  let tagName = el.getTagName()
  if (vel.tagName.toLowerCase() !== tagName) {
    el.setTagName(vel.tagName)
  }
  _updateHash({
    oldHash: el.getAttributes(),
    newHash: vel.getAttributes(),
    update: function (key, val) {
      el.setAttribute(key, val)
    },
    remove: function (key) {
      el.removeAttribute(key)
    }
  })
  _updateHash({
    oldHash: el.htmlProps,
    newHash: vel.htmlProps,
    update: function (key, val) {
      el.setProperty(key, val)
    },
    remove: function (key) {
      el.removeProperty(key)
    }
  })
  _updateListeners({
    el,
    oldListeners: el.getEventListeners(),
    newListeners: vel.getEventListeners()
  })

  // special treatment of HTML elements having custom innerHTML
  if (vel.hasInnerHTML()) {
    if (!el._hasInnerHTML) {
      el.empty()
      el.setInnerHTML(vel.getInnerHTML())
    } else {
      let oldInnerHTML = el.getInnerHTML()
      let newInnerHTML = vel.getInnerHTML()
      if (oldInnerHTML !== newInnerHTML) {
        el.setInnerHTML(newInnerHTML)
      }
    }
    el._hasInnerHTML = true
  }
}

function _hashGet (hash, key) {
  if (hash instanceof Map) {
    return hash.get(key)
  } else {
    return hash[key]
  }
}

function _updateHash ({ newHash, oldHash, update, remove }) {
  if (!newHash && !oldHash) return
  // TODO: this could be improved with a simpler impl that removes all old
  if (!newHash) {
    newHash = new Map()
  }
  // TODO: this could be improved with a simpler impl that adds all new
  if (!oldHash) {
    oldHash = new Map()
  }
  let updatedKeys = {}
  // FIXME: this is not working as expected in browser
  // i.e. _hashGet does not take the 'AttrbutesMap' thing into account
  // and provides 'undefined' for the most cases
  for (let key of newHash.keys()) {
    let oldVal = _hashGet(oldHash, key)
    let newVal = _hashGet(newHash, key)
    updatedKeys[key] = true
    if (oldVal !== newVal) {
      update(key, newVal)
    }
  }
  // TODO: try to consolidate this.
  // we have a horrible mixture of Objects and Maps here
  // want to move to the Map based impl
  if (isFunction(oldHash.keys) && oldHash.size > 0) {
    let keys = Array.from(oldHash.keys())
    keys.forEach((key) => {
      if (!updatedKeys[key]) {
        remove(key)
      }
    })
  } else {
    for (let key in oldHash) {
      if (oldHash.hasOwnProperty(key) && !updatedKeys[key]) {
        remove(key)
      }
    }
  }
}

function _updateListeners (args) {
  let el = args.el
  // NOTE: considering the low number of listeners
  // it is quicker to just remove all
  // and add again instead of computing the minimal update
  let newListeners = args.newListeners || []
  el.removeAllEventListeners()
  for (let i = 0; i < newListeners.length; i++) {
    el.addEventListener(newListeners[i])
  }
}

function _findForwardingChildOfComponent (comp, forwarded) {
  let current = forwarded.getParent()
  while (current) {
    let parent = current.getParent()
    if (parent === comp) {
      return current
    }
    current = parent
  }
}

/*
  Descending Context used by RenderingEngine
*/
class DescendingContext {
  constructor (state, captureContext) {
    this.state = state
    this.owner = captureContext.owner
    this.refs = new Map()
    this.foreignRefs = new Map()
    this.internalRefs = null
    this.elements = captureContext.elements
    this.pos = 0
    this.updates = captureContext.components.length
    this.remaining = this.updates
    this.injectedComponents = captureContext.injectedComponents

    this.$$ = this._$$.bind(this)
  }

  _$$ () {
    let state = this.state
    let vel = this.elements[this.pos++]
    // only capture VirtualComponent's with a captured parent
    // all others have been captured at this point already
    // or will either be captured by a different owner
    if (!state.is(CAPTURED, vel) && vel._isVirtualComponent) {
      let parent = vel.parent
      if (parent && (parent === this.owner || state.is(CAPTURED, vel.parent))) {
        _capture(state, vel)
        this.updates++
        this.remaining--
      }
    }
    // Note: we return a new VirtualElement so that the render method does work
    // as expected.
    // TODO: instead of creating a new VirtualElement each time, we could return
    // an immutable wrapper for the already recorded element.
    vel = VirtualElement.createElement.apply(this, arguments)
    // these variables need to be set to make the 'ref()' API work
    vel._context = this
    vel._owner = this.owner
    // Note: important to deactivate these methods as otherwise the captured
    // element will be damaged when calling el.append()
    vel._attach = function () {}
    vel._detach = function () {}
    return vel
  }

  hasPendingCaptures () {
    return this.updates > 0 && this.remaining > 0
  }

  reset () {
    this.pos = 0
    this.updates = 0
    this.refs.clear()
  }
}

function _createWrappingVirtualComponent (comp) {
  let vel = new VirtualElement.Component(comp.constructor)
  vel._comp = comp
  let compData = _getInternalComponentData(comp)
  if (compData.elementProps) {
    vel._merge(compData.elementProps)
  }
  return vel
}

const CAPTURED = Symbol('CAPTURED')
const DETACHED = Symbol('DETACHED')
const LINKED = Symbol('LINKED')
const MAPPED = Symbol('MAPPED')
const NEW = Symbol('NEW')
const OLDPROPS = Symbol('OLDPROPS')
const OLDSTATE = Symbol('OLDSTATE')
// 'relocated' means a node with ref
// has been attached to a new parent node
const RELOCATED = Symbol('RELOCATED')
const RENDERED = Symbol('RENDERED')
const SKIPPED = Symbol('SKIPPED')
const UPDATED = Symbol('UPDATED')

class RenderingState {
  constructor (componentFactory, elementFactory) {
    this.componentFactory = componentFactory
    this.elementFactory = elementFactory
    this.polluted = []
    this.id = '__' + uuid()
  }

  dispose () {
    let id = this.id
    this.polluted.forEach(function (obj) {
      delete obj[id]
    })
  }

  set (key, obj, val = true) {
    let info = obj[this.id]
    if (!info) {
      info = {}
      obj[this.id] = info
      this.polluted.push(obj)
    }
    info[key] = val
  }

  get (key, obj) {
    let info = obj[this.id]
    if (info) {
      return info[key]
    }
  }

  is (key, obj) {
    return Boolean(this.get(key, obj))
  }
}

class InternalComponentData {
  constructor () {
    this.refs = new Map()
    this.foreignRefs = new Map()
    this.internalRefs = new Map()
    this.elementProps = null
  }
}

// exposing internal API for testing
RenderingEngine._INTERNAL_API = {
  _capture,
  _wrap: _createWrappingVirtualComponent,
  _update,
  CAPTURED,
  DETACHED,
  LINKED,
  MAPPED,
  NEW,
  RELOCATED,
  RENDERED,
  SKIPPED,
  TOP_LEVEL_ELEMENT,
  UPDATED
}
