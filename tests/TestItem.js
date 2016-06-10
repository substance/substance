'use strict';

var Component = require('../ui/Component');
var RenderingEngine = require('../ui/RenderingEngine');
var ResultItem = require('./ResultItem');

function TestItem() {
  TestItem.super.apply(this, arguments);

  this.onStart = this.onStart.bind(this);
  this.onResult = this.onResult.bind(this);
  this.onEnd = this.onEnd.bind(this);
}

TestItem.Prototype = function() {

  this.didMount = function() {
    this.props.test.on('prerun', this.onStart);
    this.props.test.on('result', this.onResult);
    this.props.test.on('end', this.onEnd);
  };

  this.dispose = function() {
    this.props.test.removeListener('prerun', this.onStart);
    this.props.test.removeListener('result', this.onResult);
    this.props.test.removeListener('end', this.onEnd);
  };

  this.render = function($$) {
    var test = this.props.test;
    var el = $$('div').addClass('sc-test');
    el.append($$('div').addClass('se-name').append(test.name));
    el.append($$('div').addClass('se-results').ref('results'));
    el.append($$('div').addClass('se.sandbox').ref('sandbox'));
    return el;
  };

  this.onStart = function() {
    var test = this.props.test;
    if (test.skip) this.el.addClass('sm-skip');
    else this.el.removeClass('sm-skip');
    this.refs.results.empty();
    this.props.test.sandbox = this.refs.sandbox.el;
  };

  this.onResult = function(result) {
    var renderContext = RenderingEngine.createContext(this);
    var $$ = renderContext.$$;
    this.refs.results.append($$(ResultItem, {
      test: this.props.test,
      result: result
    }));
  };

  this.onEnd = function() {
    var test = this.props.test;
    if (test.ok) {
      this.el.addClass('sm-ok');
    } else if (!test.skip) {
      this.el.addClass('sm-not-ok');
    }
  };

};

Component.extend(TestItem);

module.exports = TestItem;