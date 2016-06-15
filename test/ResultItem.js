'use strict';

var Component = require('../ui/Component');

function ResultItem() {
  ResultItem.super.apply(this, arguments);
}

ResultItem.Prototype = function() {

  this.shouldRerender = function() {
    return false;
  };

  this.render = function($$) {
    var test = this.props.test;
    var result = this.props.result;
    var el = $$('div').addClass('sc-test-result');

    var header = $$('div');
    if (!test._skip) {
      if (result.ok) {
        header.append($$('span').addClass('se-status sm-ok').append("\u2713"));
      } else {
        header.append($$('span').addClass('se-status sm-not-ok').append("\u26A0"));
      }
    }
    header.append($$('span').addClass('se-description').append(result.name));
    el.append(header);

    if (!test._skip && !result.ok && result.operator === "equal") {
      var diff = $$('div').addClass('se-diff');
      var expected = $$('div').addClass('se-expected')
        .append('Expected:')
        .append($$('pre').append(String(result.expected)));
      var actual = $$('div').addClass('se-actual')
        .append('Actual:')
        .append($$('pre').append(String(result.actual)));
      diff.append(expected, actual);
      el.append(diff);
    }

    return el;
  };

};

Component.extend(ResultItem);

module.exports = ResultItem;
