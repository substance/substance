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
    el.append($$('div').addClass('se-name').append(result.name));
    if (!test._skip) {
      if (result.ok) {
        el.addClass('sm-ok');
      } else {
        el.addClass('sm-not-ok');
      }
    }
    return el;
  };

};

Component.extend(ResultItem);

module.exports = ResultItem;
