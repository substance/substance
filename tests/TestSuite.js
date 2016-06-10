'use strict';

var Component = require('../ui/Component');
var TestItem = require('./TestItem');

function TestSuite() {
  TestSuite.super.apply(this, arguments);
}

TestSuite.Prototype = function() {

  this.didMount = function() {
    this.props.harness.runAllTests();
  };

  this.render = function($$) {
    var el = $$('div').addClass('sc-test-suite');

    this.props.harness.getTests().forEach(function(test) {
      el.append($$(TestItem, { test: test }));
    });

    return el;
  };

};

Component.extend(TestSuite);

module.exports = TestSuite;