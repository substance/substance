"use strict";

var each = require('lodash/each');
var oo = require('../util/oo');
var VirtualElement = require('./VirtualElement');
var DefaultDOMElement = require('./DefaultDOMElement');

function RenderingEngine() {}

RenderingEngine.Prototype = function() {

  this._rerender = function(comp) {
    var vel = _createWrappingVirtualComponent(comp);
    _capture(vel, 'forceCapture');
    if (vel._isVirtualComponent) {
      _render(vel._content);
    } else {
      _render(vel);
    }
  };

  // this is used together with the incremental Component API
  this._renderChild = function(comp, vel) {
    // HACK: to make this work with the rest of the implementation
    // we ingest a fake parent
    vel.parent = { _comp: comp };
    _capture(vel);
    _render(vel);
    return vel._comp;
  };

  function _create(vel) {
    var Component = require('./Component');
    var comp = vel._comp;
    console.assert(!comp, "Component instance should not exist when this method is used.");
    var parent = vel.parent._comp;
    // making sure the parent components have been instantiated
    if (!parent) {
      parent = _create(vel.parent);
    }
    if (vel._isVirtualComponent) {
      console.assert(parent, "A Component should have a parent.");
      comp = new vel.ComponentClass(parent, vel.props);
      comp.__htmlConfig__ = vel._copyHTMLConfig();
    } else if (vel._isVirtualHTMLElement) {
      comp = new Component.Element(parent, vel);
    } else if (vel._isVirtualTextNode) {
      comp = new Component.TextNode(parent, vel);
    }
    vel._comp = comp;
    return comp;
  }

  function _capture(vel, forceCapture) {
    if (vel.__isCaptured__) {
      return vel;
    }
    // a captured VirtualElement has a component instance attached
    var comp = vel._comp;
    if (!comp) {
      comp = _create(vel);
    }
    if (vel._isVirtualComponent) {
      var needRerender;
      // NOTE: forceCapture is used for the first entrance
      // from this.render(comp) where we want to fource capturing
      // as it has already been cleared that a rerender is necessary
      if (forceCapture) {
        needRerender = true;
      } else {
        // NOTE: don't ask if shouldRerender if no element is there yet
        needRerender = !comp.el || comp.shouldRerender(vel.props);
        comp.__htmlConfig__ = vel._copyHTMLConfig();
        comp._setProps(vel.props);
      }
      if (needRerender) {
        var context = new CaptureContext(vel);
        var content = comp.render(context.$$);
        if (comp.__htmlConfig__) {
          content._mergeHTMLConfig(comp.__htmlConfig__);
        }
        content._comp = comp;
        vel._content = content;
        // Mapping: map virtual elements to existing components based on refs
        _prepareVirtualComponent(comp, content);
        // Descending
        // TODO: only do this in DEBUG mode
        if (RenderingEngine.DEBUG) {
          // in this case we use the render() function as iterating function, where
          // $$ is a function which creates components and renders them recursively.
          // NOTE: calling $$ here will use _capture for capturing child components
          // recursively
          var descendingContext = new DescendingContext(context);
          while (descendingContext.hasPendingCaptures()) {
            descendingContext.reset();
            comp.render(descendingContext.$$);
          }
        }
        _capture(vel._content);
      } else {
        vel.__skip__ = true;
      }
    }
    // capture children
    if (vel.children) {
      for (var i = 0; i < vel.children.length; i++) {
        _capture(vel.children[i]);
      }
    }
    vel.__isCaptured__ = true;
    return vel;
  }

  function _render(vel) {
    var state = { removed: [] };
    if (vel.__skip__) return;
    // before changes can be applied, a VirtualElement must have been captured
    console.assert(vel.__isCaptured__, 'VirtualElement must be captured before rendering');

    var comp = vel._comp;
    console.assert(comp && comp._isComponent, "A captured VirtualElement must have a component instance attached.");

    // VirtualComponents apply changes to its content element
    if (vel._isVirtualComponent) {
      return _render(vel._content);
    }
    // render the element
    if (!comp.el) {
      comp.el = _createElement(vel);
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
        if (!childComp) {
          console.log('Removing orphaned DOM element.');
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
        } while (oldComp && oldComp.__isDetached__);

        virtualComp = newChildren[pos2++];
        // remove remaining old ones if no new one is left
        if (oldComp && !virtualComp) {
          while (oldComp) {
            _removeChild(state, comp, oldComp);
            oldComp = oldChildren[pos1++];
          }
          break;
        }

        if (!virtualComp.__isRendered__) {
          _render(virtualComp);
        }

        newComp = virtualComp._comp;
        console.assert(newComp, 'Component instance should now be available.');
        // append remaining new ones if no old one is left
        if (virtualComp && !oldComp) {
          _appendChild(comp, newComp);
          continue;
        }
        // Differential update
        else if (virtualComp.__isMapped__) {
          // identity
          if (newComp === oldComp) {
            // no structural change
          } else {
            // the order of elements with ref has changed
            // TODO: think of a better way than just removing
            _removeChild(state, comp, oldComp);
            pos2--;
          }
        }
        else if (oldComp.__isMapped__) {
          _insertChildBefore(comp, newComp, oldComp);
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
    // finally dispose all removed elements (which have not been relocated)
    state.removed.forEach(function(comp) {
      if (comp.__isDetached__) {
        comp.triggerDispose();
      }
    });

    // HACK: a temporary solution to handle refs owned by an ancestor
    // is to store them here as well, so that we can map virtual components
    // efficiently
    var refs = {};
    var foreignRefs = {};
    if (vel._context) {
      each(vel._context.refs, function(vel, ref) {
        refs[ref] = vel._comp;
      });
      each(vel._context.foreignRefs, function(vel, ref) {
        foreignRefs[ref] = vel._comp;
      });
    }
    comp.refs = refs;
    comp.__foreignRefs__ = foreignRefs;

    vel.__isRendered__ = true;
  }

  function _appendChild(parent, child) {
    parent.el.appendChild(child.el);
    _triggerDidMount(parent, child);
  }

  function _replaceChild(state, parent, oldChild, newChild) {
    parent.el.replaceChild(oldChild.el, newChild.el);
    oldChild.__isDetached__ = true;
    state.removed.push(oldChild);
    _triggerDidMount(parent, newChild);
  }

  function _insertChildBefore(parent, child, before) {
    parent.el.insertBefore(child.el, before.el);
    _triggerDidMount(parent, child);
  }

  function _removeChild(state, parent, child) {
    parent.el.removeChild(child.el);
    child.__isDetached__ = true;
    state.removed.push(child);
  }

  function _triggerDidMount(parent, child) {
    if (child.__isDetached__) {
      delete child.__isDetached__;
    } else if (parent.isMounted()) {
      child.triggerDidMount(true);
    }
  }

  /*
    Prepares a new virtual component by comparing it with
    the old version.

    It sets the _comp references in the new version where its ancestors
    can be mapped to corresponding virtual components in the old version.
  */
  function _prepareVirtualComponent(comp, vc) {
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
    each(oldRefs, _clearIsMapped);
    each(oldForeignRefs, _clearIsMapped);
    // map virtual components to existing ones
    each(newRefs, function(vc, ref) {
      var comp = oldRefs[ref];
      if (comp) _mapComponents(comp, vc);
    });
    each(foreignRefs, function(vc, ref) {
      var comp = oldForeignRefs[ref];
      if (comp) _mapComponents(comp, vc);
    });
  }

  function _clearIsMapped(comp) {
    while(comp) {
      delete comp.__isMapped__;
      comp = comp.getParent();
    }
  }

  /*
    This tries to map the virtual component to existing component instances
    by looking at the old and new refs, making sure that the element type is
    compatible.
    This is then applied to the ancestors leading to an implicit
    mapping of parent elements, which makes
  */
  function _mapComponents(comp, vc) {
    while (comp && vc) {
      // Stop if one them has been mapped already
      // or the virtual element has its own component already
      // or if virtual element and component do not match semantically
      // Note: the owner component is mapped at very first, so this
      // recursion will stop at the owner at the latest.
      if (vc.__isMapped__ || comp.__isMapped__ ||
          vc._comp || !_isOfSameType(comp, vc))
      {
        break;
      }
      vc._comp = comp;
      vc.__isMapped__ = true;
      // TODO: can we somehow avoid poluting the component?
      comp.__isMapped__ = true;
      comp = comp.getParent();
      vc = vc.getParent();
    }
  }

  function _isOfSameType(comp, vc) {
    return (
      (comp._isElementComponent && vc._isVirtualHTMLElement) ||
      (comp._isComponent && vc._isVirtualComponent && comp.constructor === vc.ComponentClass) ||
      (comp._isTextNodeComponent && vc._isVirtualTextNode)
    );
  }

  function _createElement(vel) {
    var el;
    // TODO: we need a element factory here
    // this is fine as long we have only one DOMElement implementation per platform
    if (vel._isVirtualTextNode) {
      el = DefaultDOMElement.createTextNode(vel.text);
    } else {
      el = DefaultDOMElement.createElement(vel.tagName);
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
    if (vel.tagName !== tagName) {
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
        if (oldVal !== newVal) {
          updatedKeys[key] = true;
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
    var oldListeners = args.oldListeners || [];
    var newListeners = args.newListeners || [];
    // NOTE: considering the low number of listeners
    // it is quicker to just remove and add instead of computing the minimal update
    var i;
    for (i=0; i<oldListeners.length;i++) {
      el.removeEventListener(oldListeners[i]);
    }
    for (i=0; i<newListeners.length;i++) {
      el.addEventListener(newListeners[i]);
    }
  }

  function DescendingContext(captureContext) {
    this.owner = captureContext.owner;
    this.refs = {};
    this.foreignRefs = {};
    this.elements = captureContext.elements;
    this.updates = captureContext.components.length;
    this.pos = 0;

    this.$$ = this._createComponent.bind(this);
  }
  DescendingContext.Prototype = function() {
    this._createComponent = function() {
      var vel = this.elements[this.pos++];
      if (!vel.__isCaptured__ && this._ancestorsReady(vel.parent)) {
        _capture(vel);
        this.updates++;
      }
      vel = VirtualElement.createElement.apply(null, arguments);
      vel._context = this;
      vel._owner = this.owner;
      return vel;
    };
    this.hasPendingCaptures = function() {
      return this.updates > 0;
    };
    this.reset = function() {
      this.pos = 0;
      this.updates = 0;
    };
    this._ancestorsReady = function(vel) {
      while (vel) {
        if (vel === this.owner || vel.__isCaptured__) {
          return true;
        }
        vel = vel.parent;
      }
      return false;
    };
  };
  oo.initClass(DescendingContext);
};

oo.initClass(RenderingEngine);

function CaptureContext(owner) {
  this.owner = owner;
  this.refs = {};
  this.foreignRefs = {};
  this.elements = [];
  this.components = [];
  this.$$ = this._createComponent.bind(this);
}

CaptureContext.prototype._createComponent = function() {
  var vel = VirtualElement.createElement.apply(null, arguments);
  vel._context = this;
  vel._owner = this.owner;
  if (vel._isVirtualComponent) {
    // virtual components need to be captured recursively
    this.components.push(vel);
  }
  this.elements.push(vel);
  return vel;
};

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

RenderingEngine.DEBUG = false;

module.exports = RenderingEngine;
