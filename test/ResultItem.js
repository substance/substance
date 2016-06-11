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
    if (!test._skip) {
      if (result.ok) {
        el.append($$('span').addClass('se-status sm-ok').append("\u2713"));
      } else {
        el.append($$('span').addClass('se-status sm-not-ok').append("\u26A0"));
      }
    }
    el.append($$('span').addClass('se-description').append(result.name));
    return el;
  };

};

Component.extend(ResultItem);

module.exports = ResultItem;
