'use strict';

var UITest = require('../UITest').InBrowser;

var Component = require('../../ui/Component');

function component(renderFunc, props) {
  var comp = new Component(null, props);
  if (renderFunc) {
    comp.render = renderFunc;
  }
  return comp;
}

UITest("Three elements", function(t) {
  var sandbox = t.sandbox; // eslint-disable-line
  var comp = component(function($$) {
    return $$('div').append(
      $$('span').append('Foo'),
      $$('span').append('Bar'),
      $$('span').append('Baz')
    );
  });
  function runChecks() {
    var el = comp.getNativeElement();
    t.equal(el.tagName.toLowerCase(), 'div', "Component element should be a 'div'");
    t.equal(el.childNodes.length, 3, ".. with 3 child nodes");
    var first = el.childNodes[0];
    var second = el.childNodes[1];
    var third = el.childNodes[2];
    t.equal(first.tagName.toLowerCase(), 'span', "First should be a 'span'");
    t.equal(first.childNodes.length, 1, ".. with one child node");
    t.equal(first.childNodes[0].nodeType, window.Node.TEXT_NODE, ".. which is a TEXT_NODE");
    t.equal(first.childNodes[0].textContent, 'Foo', ".. with content 'Foo'");
    t.equal(second.tagName.toLowerCase(), 'span', "Second should be a 'span'");
    t.equal(second.childNodes.length, 1, ".. with one child node");
    t.equal(second.childNodes[0].nodeType, window.Node.TEXT_NODE, ".. which is a TEXT_NODE");
    t.equal(second.childNodes[0].textContent, 'Bar', ".. with content 'Bar'");
    t.equal(third.tagName.toLowerCase(), 'span', "Third should be a 'span'");
    t.equal(third.childNodes.length, 1, ".. with one child node");
    t.equal(third.childNodes[0].nodeType, window.Node.TEXT_NODE, ".. which is a TEXT_NODE");
    t.equal(third.childNodes[0].textContent, 'Baz', ".. with content 'Baz'");
  }
  comp.mount(sandbox);
  runChecks();
  comp.rerender();
  runChecks();
  t.end();
});
