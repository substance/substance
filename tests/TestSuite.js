'use strict';

var Component = require('../ui/Component');
var TestItem = require('./TestItem');

function TestSuite() {
  TestSuite.super.apply(this, arguments);
}

TestSuite.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-test-suite');

    el.append(
      $$('button').text('RUN ALL TESTS')
        .on('click', this.onClickRunTests)
    );

    this.props.harness.getTests().forEach(function(test) {
      el.append($$(TestItem, { test: test }));
    });

    el.append(
      $$('button').text('RUN ALL TESTS')
        .on('click', this.onClickRunTests)
    );

    return el;
  };

  this.onClickRunTests = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.props.harness.runAllTests();
  };

};

Component.extend(TestSuite);

module.exports = TestSuite;