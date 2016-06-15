"use strict";

var DocumentSession = require('../../model/DocumentSession');
var Component = require('../../ui/Component');
var ContainerEditor = require('../../ui/ContainerEditor');
var createTestArticle = require('../fixtures/createTestArticle');
var createTestComponentRegistry = require('../fixtures/createTestComponentRegistry');
var nestedContainers = require('../fixtures/nestedContainers');

var test = require('../test').module('ui/IsolatedNodes');

function _setup(fixture) {
  var doc = createTestArticle(fixture);
  var docSession = new DocumentSession(doc);
  var componentRegistry = createTestComponentRegistry();
  var App = Component.extend({
    getChildContext: function() {
      return {
        documentSession: docSession,
        document: doc,
        componentRegistry: componentRegistry
      };
    },
    render: function($$) {
      return $$('div').append($$(ContainerEditor, {
        node: doc.get('body')
      }).ref('editor'));
    },
  });
  var app = App.static.render();
  // faking a mounted scenario
  app.triggerDidMount();
  return {
    documentSession: docSession,
    doc: doc,
    app: app
  };
}

test("IsolatedNodes should be 'not-selected' when selection is null", function(t) {
  var env = _setup(nestedContainers);
  var documentSession = env.documentSession;
  var isolatedNodes = env.app.findAll('.sc-isolated-node');
  documentSession.setSelection(null);
  isolatedNodes.forEach(function(isolated){
    t.ok(isolated.isNotSelected(), "isolated node '"+isolated.getId()+"' should not be selected.");
  });
  t.end();
});

test("IsolatedNodes should be 'not-selected' when selection is somewhere else", function(t) {
  var env = _setup(nestedContainers);
  var documentSession = env.documentSession;
  var doc = documentSession.getDocument();
  var isolatedNodes = env.app.findAll('.sc-isolated-node');
  documentSession.setSelection(doc.createSelection(['p1', 'content'], 0));
  isolatedNodes.forEach(function(isolated){
    t.ok(isolated.isNotSelected(), "isolated node '"+isolated.getId()+"' should not be selected.");
  });
  t.end();
});

test("IsolatedNode should be 'selected' with node selection", function(t) {
  var env = _setup(nestedContainers);
  var doc = env.doc;
  var bodyEditor = env.app.find('.sc-container-editor[data-id="body"]');
  var isolatedNodes = env.app.findAll('.sc-isolated-node');
  bodyEditor.setSelection(doc.createSelection({
    type: 'node', containerId: 'body', nodeId: 'c1', mode: 'full'
  }));
  var expected = {
    'body/c1': 'selected',
    'body/c1/c1/c2': undefined,
  };
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId();
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct");
  });
  t.end();
});

test("IsolatedNode should be 'co-selected' with spanning container selection", function(t) {
  var env = _setup(nestedContainers);
  var doc = env.doc;
  var bodyEditor = env.app.find('.sc-container-editor[data-id="body"]');
  var isolatedNodes = env.app.findAll('.sc-isolated-node');
  bodyEditor.setSelection(doc.createSelection({
    type: 'container', containerId: 'body',
    startPath: ['p1', 'content'], startOffset: 1,
    endPath: ['p2', 'content'], endOffset: 2
  }));
  var expected = {
    'body/c1': 'co-selected',
    // Note: 'co-selection' does not propagate down
    // it is a state related to the parent container
    'body/c1/c1/c2/c2': undefined,
  };
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId();
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct");
  });
  t.end();
});

test("IsolatedNode should be 'focused' when having the selection", function(t) {
  var env = _setup(nestedContainers);
  var doc = env.doc;
  var documentSession = env.documentSession;
  var isolatedNodes = env.app.findAll('.sc-isolated-node');
  documentSession.setSelection(doc.createSelection({
    type: 'property',
    path: ['c1_p1', 'content'],
    startOffset: 0,
    surfaceId: 'body/c1/c1'
  }));
  var expected = {
    'body/c1': 'focused',
    'body/c1/c1/c2': undefined,
  };
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId();
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct");
  });
  t.end();
});

test("IsolatedNode should be 'co-focused' when child is having the selection", function(t) {
  var env = _setup(nestedContainers);
  var doc = env.doc;
  var documentSession = env.documentSession;
  var isolatedNodes = env.app.findAll('.sc-isolated-node');
  documentSession.setSelection(doc.createSelection({
    type: 'property',
    path: ['c2_p1', 'content'],
    startOffset: 0,
    surfaceId: 'body/c1/c1/c2/c2'
  }));
  var expected = {
    'body/c1': 'co-focused',
    'body/c1/c1/c2': 'focused',
  };
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId();
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct");
  });
  t.end();
});
