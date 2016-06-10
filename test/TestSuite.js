'use strict';

var startsWith = require('lodash/startsWith');
var Component = require('../ui/Component');
var TestItem = require('./TestItem');

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
    this.props.harness.runAllTests();
  };

  this.render = function($$) {
    var el = $$('div').addClass('sc-test-suite');

    var toolbar = $$('div').addClass('se-toolbar');
    var moduleSelect = $$('select').ref('moduleNames');
    moduleSelect.append($$('option').attr('value', '').append('---   All   --'));
    this.moduleNames.forEach(function(moduleName) {
      moduleSelect.append(
        $$('option').attr('value', moduleName).append(moduleName)
      );
    });
    moduleSelect.on('change', this.onModuleSelect);
    toolbar.append(moduleSelect);

    el.append(toolbar);
    var tests = $$('div').addClass('se-tests').ref('tests');
    this.props.harness.getTests().forEach(function(test) {
      tests.append($$(TestItem, { test: test }));
    });
    el.append(tests);

    return el;
  };

  this.onModuleSelect = function() {
    var filter = this.refs.moduleNames.htmlProp('value');
    var testItems = this.refs.tests.getChildren();
    var tests = [];
    testItems.forEach(function(testItem) {
      var t = testItem.props.test;
      if(startsWith(t.moduleName, filter)) {
        testItem.removeClass('sm-hidden');
        tests.push(t);
      } else {
        testItem.addClass('sm-hidden');
      }
    });
    this.props.harness.runTests(tests);
  };

};

Component.extend(TestSuite);

module.exports = TestSuite;