'use strict';

var Component = require('../../ui/Component');
var spy = require('../spy');

function TestComponent() {
  TestComponent.super.apply(this, arguments);
  this._enableSpies();
}

TestComponent.Prototype = function() {

  this._enableSpies = function() {
    ['didMount','didUpdate','dispose','shouldRerender','render'].forEach(function(name) {
      spy(this, name);
    }.bind(this));
  };

  this._disableSpies = function() {
    ['didMount','didUpdate','dispose','shouldRerender','render'].forEach(function(name) {
      this[name].restore();
    }.bind(this));
  };
};

Component.extend(TestComponent);

TestComponent.create = function(renderFunc, props) {
  var comp = new TestComponent();
  if (renderFunc) {
    comp.render = renderFunc;
  }
  if (props) {
    comp.setProps(props);
  } else {
    comp.rerender();
  }
  return comp;
};

function SimpleComponent() {
  SimpleComponent.super.apply(this, arguments);
}

SimpleComponent.Prototype = function() {
  this.render = function($$) {
    var el = $$('div').addClass('simple-component');
    if (this.props.children) {
      el.append(this.props.children);
    }
    return el;
  };
};

TestComponent.extend(SimpleComponent);
TestComponent.Simple = SimpleComponent;

module.exports = TestComponent;
