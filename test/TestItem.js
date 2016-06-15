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

    var header = $$('div').addClass('se-header');
    header.append($$('div').addClass('se-name').append(test.name));
    el.append(header);

    var controls = $$('span').addClass('se-controls').append(
      $$('button').addClass('se-run')
        .append('Run')
        .on('click', this.onClickRun)
    );
    el.append(controls);

    var body = $$('div').addClass('se-body');
    body.append($$('div').addClass('se-results').ref('results'));
    body.append($$('div').addClass('se-sandbox').ref('sandbox'));
    el.append(body);

    el.on('click', this.toggleExpand);

    return el;
  };

  this.onStart = function() {
    var test = this.props.test;
    this.el.removeClass('sm-skip');
    if (test._skip) this.el.addClass('sm-skip');
    this.refs.results.empty();
    this.refs.sandbox.empty();
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
    if (test._skip) {
      this.el.addClass('sm-skip');
    } else if (test._ok) {
      this.el.addClass('sm-ok');
    } else {
      this.el.addClass('sm-not-ok');
    }
  };

  this.onClickRun = function(e) {
    e.preventDefault();
    e.stopPropagation();
    var test = this.props.test;
    test.reset();
    test.run();
  };

  this.toggleExpand = function(e) {
    e.preventDefault();
    e.stopPropagation();
    var expanded = this.el.hasClass('sm-expanded');
    if (expanded) this.el.removeClass('sm-expanded');
    else this.el.addClass('sm-expanded');
  };

};

Component.extend(TestItem);

module.exports = TestItem;