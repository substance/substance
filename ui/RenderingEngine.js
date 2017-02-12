import forEach from '../util/forEach'
import uuid from '../util/uuid'
import substanceGlobals from '../util/substanceGlobals'
import VirtualElement from './VirtualElement'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import Component from './Component'

/*

  ## Rendering Algorithm

  TODO: document the algorithm

  ## Findings

  What makes our rendering algorithm so difficult?

  - Dependency Injection requires a (direct) parent to be allow constructor injection, i.e. that injected dependencies
    are available in the constructor already. As a consequence a component tree must to be constructed from top to down.

  - The earliest time to evaluate `$$(MyComponent)`, is when it has been attached to an existing component.
    I.e., to run `MyComponent.render()` an instance of `MyComponent` is needed, which can only be created with an existing
    parent component.

  - In general, it is *not* possible to have a naturally descending rendering algorithm, i.e. a simple recursion calling
    `render()` and creating or updating Components on the way, preserving a simple stack-trace.
    Instead, it requires calling `render()` on one level, then doing comparisons with the existing tree
    to be able to reuse components, and then descend into the sub-tree.

  - If components are passed down via props, things get even more difficult.
    For example, consider a situation where components are passed via props:
    ```
      render($$) {
        return $$('div').append(
          $$(Wrapper, {
            foo: $$(MyComponent)
          })
        )
      }
    ```
    At the time when this component gets rendered, `MyComponent` can not be instantiated, as it is not known what `Wrapper`
    actually does with it.
    While the general approach is working from top-to-down, in this case it has a bottom-to-up nature, i.e., the child needs
    to be rendered to know what to do with the passed component.

    Particularly, this is problematic when the passed component has a reference:
    ```
      render($$) {
        return $$('div').append(
          $$(Wrapper, {
            foo: $$(MyComponent).ref('foo')
          })
        )
      }
    ```
    As nothing is known at the time of descending about the content of `Wrapper` the rendering algorithm
    can not tell that it ought to be preserved. For now, the correct way to deal with this situation is
    to use a reference for the wrapper as well:
    ```
      render($$) {
        return $$('div').append(
          $$(Wrapper, {
            foo: $$(MyComponent).ref('foo')
          }).ref('wrapper')
        )
      }
    ```

  ## TODO

  There is a lot of hacks in the current implementation, which should be cleaned up when we have time.
  - remove means to change props of VirtualComponent dynamically: currently, it is possible to do something like
    ```
      $$(MyComponent).attr({ "data-id": "foo" }).append('foo')
    ```
    ATM, `attr()` and `append()` represent a means to change the `props` of the component.
    This is pretty inconsistent and creates confusion about the responsibility for rendering the element.
    Only the Component's `render()` should be responsible for that. If necessary, children or anything like that must
    be passed down via props.
  - remove outlets: outlets are just another way to change props.
  - try to fuse `virtualComponent._content` into virtualComponent: ATM, `VirtualComponent` uses a `VirtualHTMLElement`
    instance to store the result of `render()`. This makes understanding the virtual tree after rendering difficult,
    as there is another layer via `virtualComponent._content`.
  - Rethink strategy for 'reusing' components: ATM we consider refs as the key indicator whether to preserve a component
    or not. This makes sense essentially, but could be extended to an opportunistic strategy where components are reused
    implicitly when they are at the right place.
*/
class RenderingEngine {

  constructor(options = {}) {
    this.elementFactory = options.elementFactory || DefaultDOMElement.createDocument('html')
  }

  _render(comp, oldProps, oldState) {
    // var t0 = Date.now();
    var vel = _createWrappingVirtualComponent(comp);
    var state = new RenderingEngine.State(this.elementFactory);
    if (oldProps) {
      state.setOldProps(vel, oldProps);
    }
    if (oldState) {
      state.setOldState(vel, oldState);
    }
    try {
      _capture(state, vel, 'forceCapture');
      if (vel._isVirtualComponent) {
        _render(state, vel._content);
      } else {
        _render(state, vel);
      }
      _triggerUpdate(state, vel);
    } finally {
      state.dispose();
    }
    // console.log("RenderingEngine: finished rendering in %s ms", Date.now()-t0);
  }

  // this is used together with the incremental Component API
  _renderChild(comp, vel) {
    // HACK: to make this work with the rest of the implementation
    // we ingest a fake parent
    var state = new RenderingEngine.State(this.elementFactory);
    vel.parent = { _comp: comp };
    try {
      _capture(state, vel);
      _render(state, vel);
      return vel._comp;
    } finally {
      state.dispose();
    }
  }
}


function _create(state, vel) {
  var comp = vel._comp;
  console.assert(!comp, "Component instance should not exist when this method is used.");
  var parent = vel.parent._comp;
  // making sure the parent components have been instantiated
  if (!parent) {
    parent = _create(state, vel.parent);
  }
  if (vel._isVirtualComponent) {
    console.assert(parent, "A Component should have a parent.");
    comp = new vel.ComponentClass(parent, vel.props);
    // HACK: making sure that we have the right props
    vel.props = comp.props
    comp.__htmlConfig__ = vel._copyHTMLConfig();
  } else if (vel._isVirtualHTMLElement) {
    comp = new Component.Element(parent, vel);
  } else if (vel._isVirtualTextNode) {
    comp = new Component.TextNode(parent, vel);
  }
  if (vel._ref) {
    comp._ref = vel._ref;
  }
  if (vel._owner) {
    comp._owner = vel._owner._comp;
  }
  vel._comp = comp;
  return comp;
}

function _capture(state, vel, forceCapture) {
  if (state.isCaptured(vel)) {
    return vel;
  }
  // a captured VirtualElement has a component instance attached
  var comp = vel._comp;
  if (!comp) {
    comp = _create(state, vel);
    state.setNew(vel);
  }
  if (vel._isVirtualComponent) {
    var needRerender;
    // NOTE: forceCapture is used for the first entrance
    // from this.render(comp) where we want to fource capturing
    // as it has already been cleared that a rerender is necessary
    if (forceCapture) {
      needRerender = true;
    } else {
      // NOTE: don't ask shouldRerender if no element is there yet
      needRerender = !comp.el || comp.shouldRerender(vel.props, comp.state);
      comp.__htmlConfig__ = vel._copyHTMLConfig();
      state.setOldProps(vel, comp.props);
      state.setOldState(vel, comp.state);
      // updates prop triggering willReceiveProps
      comp._setProps(vel.props);
      if (!state.isNew(vel)) {
        state.setUpdated(vel);
      }
    }
    if (needRerender) {
      var context = new CaptureContext(vel);
      var content = comp.render(context.$$);
      if (!content || !content._isVirtualHTMLElement) {
        throw new Error("Component.render must return VirtualHTMLElement");
      }

      if (comp.__htmlConfig__) {
        content._mergeHTMLConfig(comp.__htmlConfig__);
      }
      content._comp = comp;
      vel._content = content;
      if (!state.isNew(vel) && comp.isMounted()) {
        state.setUpdated(vel);
      }
      // Mapping: map virtual elements to existing components based on refs
      _prepareVirtualComponent(state, comp, content);
      // Descending
      // TODO: only do this in DEBUG mode
      if (substanceGlobals.DEBUG_RENDERING) {
        // in this case we use the render() function as iterating function, where
        // $$ is a function which creates components and renders them recursively.
        // first we can create all element components that can be reached
        // without recursion
        var stack = content.children.slice(0);
        while (stack.length) {
          var child = stack.shift();
          if (state.isCaptured(child)) continue
          // virtual components are addressed via recursion, not captured here
          if (child._isVirtualComponent) continue
          if (!child._comp) {
            _create(state, child);
          }
          if (child._isVirtualHTMLElement && child.children.length > 0) {
            stack = stack.concat(child.children);
          }
          state.setCaptured(child);
        }
        state.setCaptured(content);
        // then we run comp.render($$) with a special $$ that captures VirtualComponent's
        // recursively
        var descendingContext = new DescendingContext(state, context);
        while (descendingContext.hasPendingCaptures()) {
          descendingContext.reset();
          comp.render(descendingContext.$$);
        }
      } else {
        // a VirtualComponent has its content as a VirtualHTMLElement
        // which needs to be captured recursively
        _capture(state, vel._content);
      }
    } else {
      state.setSkipped(vel);
    }
  } else if (vel._isVirtualHTMLElement) {
    for (var i = 0; i < vel.children.length; i++) {
      _capture(state, vel.children[i]);
    }
  }
  state.setCaptured(vel);
  return vel;
}

function _render(state, vel) {
  if (state.isSkipped(vel)) return;

  // before changes can be applied, a VirtualElement must have been captured
  // FIXME: with DEBUG_RENDERING we are having troubles with this assumption.
  // It happens when the rerendered component is having children injected from its parent.
  // Then the parent is no rerendered this, these injected components are not recaptured, and this assertion does not hold.
  // However, it seems not to be critical, as these components don't need to be rerendered
  // Still we should find a consistent way

  var comp = vel._comp;
  console.assert(comp && comp._isComponent, "A captured VirtualElement must have a component instance attached.");

  // VirtualComponents apply changes to its content element
  if (vel._isVirtualComponent) {
    _render(state, vel._content);
    return;
  }
  // render the element
  if (!comp.el) {
    comp.el = _createElement(state, vel);
    comp.el._comp = comp;
  }
  _updateElement(comp, vel);

  // structural updates are necessary only for HTML elements (without innerHTML set)
  if (vel._isVirtualHTMLElement && !vel.hasInnerHTML()) {
    var newChildren = vel.children;
    var oldComp, virtualComp, newComp;
    var pos1 = 0; var pos2 = 0;

    // HACK: removing all childNodes that are not owned by a component
    // this happened in Edge every 1s. Don't know why.
    // With this implementation all external DOM mutations will be eliminated
    var oldChildren = [];
    comp.el.getChildNodes().forEach(function(node) {
      var childComp = node._comp;

      // TODO: to allow mounting a prerendered DOM element
      // we would need to allow to 'take ownership' instead of removing
      // the element. This being a special situation, we should only
      // do that when mounting

      // remove orphaned nodes and relocated components
      if (!childComp || state.isRelocated(childComp)) {
        comp.el.removeChild(node);
      } else {
        oldChildren.push(childComp);
      }
    });

    while(pos1 < oldChildren.length || pos2 < newChildren.length) {
      // skip detached components
      // Note: components get detached when preserved nodes
      // are found in a swapped order. Then the only way is
      // to detach one of them from the DOM, and reinsert it later at the new position
      do {
        oldComp = oldChildren[pos1++];
      } while (oldComp && (state.isDetached(oldComp)));

      virtualComp = newChildren[pos2++];
      // remove remaining old ones if no new one is left
      if (oldComp && !virtualComp) {
        while (oldComp) {
          _removeChild(state, comp, oldComp);
          oldComp = oldChildren[pos1++];
        }
        break;
      }

      // Try to reuse TextNodes to avoid unnecesary DOM manipulations
      if (oldComp && oldComp.el.isTextNode() &&
          virtualComp && virtualComp._isVirtualTextNode &&
          oldComp.el.textContent === virtualComp.text ) {
        continue;
      }

      if (!state.isRendered(virtualComp)) {
        _render(state, virtualComp);
      }

      newComp = virtualComp._comp;

      // ATTENTION: relocating a component does not update its context
      if (state.isRelocated(newComp)) {
        newComp._setParent(comp);
      }

      console.assert(newComp, 'Component instance should now be available.');
      // append remaining new ones if no old one is left
      if (virtualComp && !oldComp) {
        _appendChild(state, comp, newComp);
        continue;
      }
      // Differential update
      else if (state.isMapped(virtualComp)) {
        // identity
        if (newComp === oldComp) {
          // no structural change
        } else {
          // the order of elements with ref has changed
          state.setDetached(oldComp);
          _removeChild(state, comp, oldComp);
          pos2--;
        }
      }
      else if (state.isMapped(oldComp)) {
        _insertChildBefore(state, comp, newComp, oldComp);
        pos1--;
      } else {
        // both elements are not mapped
        // TODO: we could try to reuse components if they are of same type
        // However, this needs a better mapping strategy, not only
        // based on refs.
        _replaceChild(state, comp, oldComp, newComp);
      }
    }
  }

  // HACK: a temporary solution to handle refs owned by an ancestor
  // is to store them here as well, so that we can map virtual components
  // efficiently
  var refs = {};
  var foreignRefs = {};
  if (vel._context) {
    forEach(vel._context.refs, function(vel, ref) {
      refs[ref] = vel._comp;
    });
    forEach(vel._context.foreignRefs, function(vel, ref) {
      foreignRefs[ref] = vel._comp;
    });
  }
  comp.refs = refs;
  comp.__foreignRefs__ = foreignRefs;

  state.setRendered(vel);
}

function _triggerUpdate(state, vel) {
  if (vel._isVirtualComponent) {
    if (!state.isSkipped(vel)) {
      vel._content.children.forEach(_triggerUpdate.bind(null, state));
    }
    if (state.isUpdated(vel)) {
      vel._comp.didUpdate(state.getOldProps(vel), state.getOldState(vel));
    }
  } else if (vel._isVirtualHTMLElement) {
    vel.children.forEach(_triggerUpdate.bind(null, state));
  }
}

function _appendChild(state, parent, child) {
  parent.el.appendChild(child.el);
  _triggerDidMount(state, parent, child);
}

function _replaceChild(state, parent, oldChild, newChild) {
  parent.el.replaceChild(oldChild.el, newChild.el);
  if (!state.isDetached(oldChild)) {
    oldChild.triggerDispose();
  }
  _triggerDidMount(state, parent, newChild);
}

function _insertChildBefore(state, parent, child, before) {
  parent.el.insertBefore(child.el, before.el);
  _triggerDidMount(state, parent, child);
}

function _removeChild(state, parent, child) {
  parent.el.removeChild(child.el);
  if (!state.isDetached(child)) {
    child.triggerDispose();
  }
}

function _triggerDidMount(state, parent, child) {
  if (!state.isDetached(child) &&
      parent.isMounted() && !child.isMounted()) {
    child.triggerDidMount(true);
  }
}

/*
  Prepares a new virtual component by comparing it with
  the old version.

  It sets the _comp references in the new version where its ancestors
  can be mapped to corresponding virtual components in the old version.
*/
function _prepareVirtualComponent(state, comp, vc) {
  var newRefs = {};
  var foreignRefs = {};
  // TODO: iron this out. refs are stored on the context
  // though, it would be cleaner if they were on the VirtualComponent
  // Where vc._owner would need to be a VirtualComponent and not a
  // component.
  if (vc._context) {
    newRefs = vc._context.refs;
    foreignRefs = vc._context.foreignRefs;
  }
  var oldRefs = comp.refs;
  var oldForeignRefs = comp.__foreignRefs__;
  // map virtual components to existing ones
  forEach(newRefs, function(vc, ref) {
    var comp = oldRefs[ref];
    if (comp) _mapComponents(state, comp, vc);
  });
  forEach(foreignRefs, function(vc, ref) {
    var comp = oldForeignRefs[ref];
    if (comp) _mapComponents(state, comp, vc);
  });
}

/*
  This tries to map the virtual component to existing component instances
  by looking at the old and new refs, making sure that the element type is
  compatible.
  This is then applied to the ancestors leading to an implicit
  mapping of parent elements, which makes
*/

function _mapComponents(state, comp, vc) {
  if (!comp && !vc) return true;
  if (!comp || !vc) return false;
  // Stop if one them has been mapped already
  // or the virtual element has its own component already
  // or if virtual element and component do not match semantically
  // Note: the owner component is mapped at very first, so this
  // recursion will stop at the owner at the latest.
  if (state.isMapped(vc) || state.isMapped(comp)) {
    return vc._comp === comp;
  }
  if (vc._comp) {
    if (vc._comp === comp) {
      state.setMapped(vc);
      state.setMapped(comp);
      return true;
    } else {
      return false;
    }
  }
  if (!_isOfSameType(comp, vc)) {
    return false;
  }

  vc._comp = comp;
  state.setMapped(vc);
  state.setMapped(comp);

  var canMapParent;
  var parent = comp.getParent();
  if (vc.parent) {
    canMapParent = _mapComponents(state, parent, vc.parent);
  }
  // to be able to support implicit retaining of elements
  // we need to propagate mapping through the 'preliminary' parent chain
  // i.e. not taking the real parents as rendered, but the Components into which
  // we have passed children (via vel.append() or vel.outlet().append())
  else if (vc._preliminaryParent) {
    while (parent && parent._isElementComponent) {
      parent = parent.getParent();
    }
    canMapParent = _mapComponents(state, parent, vc._preliminaryParent);
  }
  if (!canMapParent) {
    state.setRelocated(vc);
    state.setRelocated(comp);
  }
  return canMapParent;
}

function _isOfSameType(comp, vc) {
  return (
    (comp._isElementComponent && vc._isVirtualHTMLElement) ||
    (comp._isComponent && vc._isVirtualComponent && comp.constructor === vc.ComponentClass) ||
    (comp._isTextNodeComponent && vc._isVirtualTextNode)
  );
}

function _createElement(state, vel) {
  var el;
  if (vel._isVirtualTextNode) {
    el = state.elementFactory.createTextNode(vel.text);
  } else {
    el = state.elementFactory.createElement(vel.tagName);
  }
  return el;
}

function _updateElement(comp, vel) {
  if (comp._isTextNodeComponent) {
    comp.setTextContent(vel.text);
    return;
  }
  var el = comp.el;
  console.assert(el, "Component's element should exist at this point.");
  var tagName = el.getTagName();
  if (vel.tagName.toLowerCase() !== tagName) {
    el.setTagName(vel.tagName);
  }
  _updateHash({
    oldHash: el.getAttributes(),
    newHash: vel.getAttributes(),
    update: function(key, val) {
      el.setAttribute(key, val);
    },
    remove: function(key) {
      el.removeAttribute(key);
    }
  });
  _updateHash({
    oldHash: el.htmlProps,
    newHash: vel.htmlProps,
    update: function(key, val) {
      el.setProperty(key, val);
    },
    remove: function(key) {
      el.removeProperty(key);
    }
  });
  _updateListeners({
    el: el,
    oldListeners: el.getEventListeners(),
    newListeners: vel.getEventListeners()
  });

  // special treatment of HTML elements having custom innerHTML
  if (vel.hasInnerHTML()) {
    if (!el._hasInnerHTML) {
      el.empty();
      el.setInnerHTML(vel.getInnerHTML());
    } else {
      var oldInnerHTML = el.getInnerHTML();
      var newInnerHTML = vel.getInnerHTML();
      if (oldInnerHTML !== newInnerHTML) {
        el.setInnerHTML(newInnerHTML);
      }
    }
    el._hasInnerHTML = true;
  }
}

function _updateHash(args) {
  var newHash = args.newHash;
  var oldHash = args.oldHash || {};
  var updatedKeys = {};
  var update = args.update;
  var remove = args.remove;
  var key;
  for (key in newHash) {
    if (newHash.hasOwnProperty(key)) {
      var oldVal = oldHash[key];
      var newVal = newHash[key];
      updatedKeys[key] = true;
      if (oldVal !== newVal) {
        update(key, newVal);
      }
    }
  }
  for (key in oldHash) {
    if (oldHash.hasOwnProperty(key) && !updatedKeys[key]) {
      remove(key);
    }
  }
}

function _updateListeners(args) {
  var el = args.el;
  // NOTE: considering the low number of listeners
  // it is quicker to just remove all
  // and add again instead of computing the minimal update
  var newListeners = args.newListeners || [];
  el.removeAllEventListeners();
  for (var i=0; i<newListeners.length;i++) {
    el.addEventListener(newListeners[i]);
  }
}


/*
  Descending Context Used by RenderingEngine
*/

class DescendingContext {
  constructor(state, captureContext) {
    this.state = state;
    this.owner = captureContext.owner;
    this.refs = {};
    this.foreignRefs = {};
    this.elements = captureContext.elements;
    this.pos = 0;
    this.updates = captureContext.components.length;
    this.remaining = this.updates;

    this.$$ = this._createComponent.bind(this);
  }

  _createComponent() {
    var state = this.state;
    var vel = this.elements[this.pos++];
    // only capture VirtualComponent's with a captured parent
    // all others have been captured at this point already
    // or will either be captured by a different owner
    if (!state.isCaptured(vel) && vel._isVirtualComponent &&
         vel.parent && state.isCaptured(vel.parent)) {
      _capture(state, vel);
      this.updates++;
      this.remaining--;
    }
    // Note: we return a new VirtualElement so that the render method does work
    // as expected.
    // TODO: instead of creating a new VirtualElement each time, we could return
    // an immutable wrapper for the already recorded element.
    vel = VirtualElement.createElement.apply(this, arguments);
    // these variables need to be set make the 'ref()' API work
    vel._context = this;
    vel._owner = this.owner;
    // Note: important to deactivate these methods as otherwise the captured
    // element will be damaged when calling el.append()
    vel._attach = function() {};
    vel._detach = function() {};
    return vel;
  }

  hasPendingCaptures() {
    return this.updates > 0 && this.remaining > 0;
  }

  reset() {
    this.pos = 0;
    this.updates = 0;
    this.refs = {}
  }

  _ancestorsReady(vel) {
    while (vel) {
      if (this.state.isCaptured(vel) ||
          // TODO: iron this out
          vel === this.owner || vel === this.owner._content) {
        return true;
      }
      vel = vel.parent;
    }
    return false;
  }


}

RenderingEngine._internal = {
  _capture: _capture,
  _wrap: _createWrappingVirtualComponent,
}

class CaptureContext {
  constructor(owner) {
    this.owner = owner;
    this.refs = {};
    this.foreignRefs = {};
    this.elements = [];
    this.components = [];
    this.$$ = this._createComponent.bind(this);
    this.$$.capturing = true;
  }

  _createComponent() {
    var vel = VirtualElement.createElement.apply(this, arguments);
    vel._context = this;
    vel._owner = this.owner;
    if (vel._isVirtualComponent) {
      // virtual components need to be captured recursively
      this.components.push(vel);
    }
    this.elements.push(vel);
    return vel;
  }
}


function _createWrappingVirtualComponent(comp) {
  var vel = new VirtualElement.Component(comp.constructor);
  vel._comp = comp;
  if (comp.__htmlConfig__) {
    vel._mergeHTMLConfig(comp.__htmlConfig__);
  }
  return vel;
}

RenderingEngine.createContext = function(comp) {
  var vel = _createWrappingVirtualComponent(comp);
  return new CaptureContext(vel);
};


class RenderingState {

  constructor(elementFactory) {
    this.elementFactory = elementFactory
    this.poluted = [];
    this.id = "__"+uuid();
  }

  dispose() {
    var id = this.id;
    this.poluted.forEach(function(obj) {
      delete obj[id];
    });
  }

  set(obj, key, val) {
    var info = obj[this.id];
    if (!info) {
      info = {};
      obj[this.id] = info;
      this.poluted.push(obj);
    }
    info[key] = val;
  }

  get(obj, key) {
    var info = obj[this.id];
    if (info) {
      return info[key];
    }
  }

  setMapped(c) {
    this.set(c, 'mapped', true);
  }


  isMapped(c) {
    return Boolean(this.get(c, 'mapped'));
  }

  setRelocated(c) {
    this.set(c, 'relocated', true);
  }

  isRelocated(c) {
    return Boolean(this.get(c, 'relocated'));
  }

  setDetached(c) {
    this.set(c, 'detached', true);
  }

  isDetached(c) {
    return Boolean(this.get(c, 'detached'));
  }

  setCaptured(vc) {
    this.set(vc, 'captured', true);
  }

  isCaptured(vc) {
    return Boolean(this.get(vc, 'captured'));
  }

  setNew(vc) {
    this.set(vc, 'created', true);
  }

  isNew(vc) {
    return Boolean(this.get(vc, 'created'));
  }

  setUpdated(vc) {
    this.set(vc, 'updated', true);
  }

  isUpdated(vc) {
    return Boolean(this.get(vc, 'updated'));
  }

  setSkipped(vc) {
    this.set(vc, 'skipped', true);
  }

  isSkipped(vc) {
    return Boolean(this.get(vc, 'skipped'));
  }

  setRendered(vc) {
    this.set(vc, 'rendered', true);
  }

  isRendered(vc) {
    return Boolean(this.get(vc, 'rendered'));
  }

  setOldProps(vc, oldProps) {
    this.set(vc, 'oldProps', oldProps);
  }

  getOldProps(vc) {
    return this.get(vc, 'oldProps');
  }

  setOldState(vc, oldState) {
    this.set(vc, 'oldState', oldState);
  }

  getOldState(vc) {
    return this.get(vc, 'oldState');
  }
}

RenderingEngine.State = RenderingState;

export default RenderingEngine;