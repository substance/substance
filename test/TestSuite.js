'use strict';

var startsWith = require('lodash/startsWith');
var clone = require('lodash/clone');
var Component = require('../ui/Component');
// var DefaultDOMElement = require('../ui/DefaultDOMElement');
var TestItem = require('./TestItem');
var Router = require('../ui/Router');

function TestSuite() {
  TestSuite.super.apply(this, arguments);

  var moduleNames = {};
  this.props.harness.getTests().forEach(function(t) {
    if (t.moduleName) {
      moduleNames[t.moduleName] = true;
    }
  });
  this.moduleNames = Object.keys(moduleNames);
}

TestSuite.Prototype = function() {

  this.didMount = function() {
    this.router.on('route:changed', this.onRouteChange, this);
    this.router.start();

    this.runTests();
  };

  this.dispose = function() {
    this.router.off(this);
  };

  this.getInitialState = function() {
    this.router = new Router();
    return this.router.readRoute();
  };

  this.render = function($$) {
    var el = $$('div').addClass('sc-test-suite');

    var state = this.state;
    var filter = this.state.filter || '';

    var toolbar = $$('div').addClass('se-toolbar');
    var moduleSelect = $$('select').ref('moduleNames');
    moduleSelect.append($$('option').attr('value', '').append('---   All   --'));
    this.moduleNames.forEach(function(moduleName) {
      var option = $$('option').attr('value', moduleName).append(moduleName);
      if (moduleName === state.filter) option.attr('selected', true);
      moduleSelect.append(option);
    });
    moduleSelect.on('change', this.onModuleSelect);
    toolbar.append($$('div').addClass('logo').append('Substance TestSuite'));
    toolbar.append(moduleSelect);
    toolbar.append(
      $$('div').append(
        $$('input').attr({ type: 'checkbox' })
          .on('change', this.onToggleHideSuccessful).ref('hideCheckbox'),
        $$('label').append('Only show failed tests only')
      )
    );

    el.append(toolbar);

    var tests = $$('div').addClass('se-tests').ref('tests');
    this.props.harness.getTests().forEach(function(test) {
      var testItem = $$(TestItem, { test: test });
      if (!_filter(test.moduleName, filter)) {
        testItem.addClass('sm-hidden');
      }
      tests.append(testItem);
    });

    el.append(tests);

    if (this.state.hideSuccessful) {
      el.addClass('sm-hide-successful');
    }

    return el;
  };

  this.didUpdate = function() {
    this.runTests();
  };

  this.runTests = function() {
    var testItems = this.refs.tests.getChildren();
    var tests = [];
    var filter = this.state.filter || '';
    testItems.forEach(function(testItem) {
      var t = testItem.props.test;
      if(_filter(t.moduleName, filter)) {
        testItem.removeClass('sm-hidden');
        tests.push(t);
      } else {
        testItem.addClass('sm-hidden');
      }
    });
    this.props.harness.runTests(tests);
  };

  function _filter(name, f) {
    return startsWith(name, f);
  }

  this.onModuleSelect = function() {
    var filter = this.refs.moduleNames.htmlProp('value');
    this.extendState({
      filter: filter
    });
    this.updateRoute();
  };

  this.updateRoute = function() {
    this.router.writeRoute(this.state);
  };

  this.onRouteChange = function(newState) {
    this.setState(newState);
  };

  this.onToggleHideSuccessful = function() {
    var checked = this.refs.hideCheckbox.htmlProp('checked');
    if (checked) {
      this.extendState({
        hideSuccessful: checked
      });
    } else {
      var newState = clone(this.state);
      delete newState.hideSuccessful;
      this.setState(newState);
    }
    this.updateRoute();
  };

};

Component.extend(TestSuite);

module.exports = TestSuite;