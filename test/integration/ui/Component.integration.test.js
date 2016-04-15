
require('../../QUnitExtensions');
var Component = require('../../../ui/Component');

QUnit.uiModule('integration:ui/Component');

function component(renderFunc, props) {
  var comp = new Component(null, props);
  if (renderFunc) {
    comp.render = renderFunc;
  }
  return comp;
}

// Tests that apply some scenarios to the Browser DOM

QUnit.browserTest("Three elements", function(assert) {
  var comp = component(function($$) {
    return $$('div').append(
      $$('span').append('Foo'),
      $$('span').append('Bar'),
      $$('span').append('Baz')
    );
  });
  function runChecks() {
    var el = comp.getNativeElement();
    assert.equal(el.tagName.toLowerCase(), 'div', "Component element should be a 'div'");
    assert.equal(el.childNodes.length, 3, ".. with 3 child nodes");
    var first = el.childNodes[0];
    var second = el.childNodes[1];
    var third = el.childNodes[2];
    assert.equal(first.tagName.toLowerCase(), 'span', "First should be a 'span'");
    assert.equal(first.childNodes.length, 1, ".. with one child node");
    assert.equal(first.childNodes[0].nodeType, window.Node.TEXT_NODE, ".. which is a TEXT_NODE");
    assert.equal(first.childNodes[0].textContent, 'Foo', ".. with content 'Foo'");
    assert.equal(second.tagName.toLowerCase(), 'span', "Second should be a 'span'");
    assert.equal(second.childNodes.length, 1, ".. with one child node");
    assert.equal(second.childNodes[0].nodeType, window.Node.TEXT_NODE, ".. which is a TEXT_NODE");
    assert.equal(second.childNodes[0].textContent, 'Bar', ".. with content 'Bar'");
    assert.equal(third.tagName.toLowerCase(), 'span', "Third should be a 'span'");
    assert.equal(third.childNodes.length, 1, ".. with one child node");
    assert.equal(third.childNodes[0].nodeType, window.Node.TEXT_NODE, ".. which is a TEXT_NODE");
    assert.equal(third.childNodes[0].textContent, 'Baz', ".. with content 'Baz'");
  }
  comp.mount(this.sandbox);
  runChecks();
  comp.rerender();
  runChecks();
});
