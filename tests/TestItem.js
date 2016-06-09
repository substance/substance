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
    return el;
  };

  this.onStart = function() {
    this.refs.results.empty();
  };

  this.onResult = function(result) {
    var renderContext = RenderingEngine.createContext(this);
    var $$ = renderContext.$$;
    this.refs.results.append($$(ResultItem, { result: result }));
  };

  this.onEnd = function() {
    // console.log('Finished test %s', this.props.test.name);
  };

};

Component.extend(TestItem);

module.exports = TestItem;