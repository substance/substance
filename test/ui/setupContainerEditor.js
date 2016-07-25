'use strict';

var DocumentSession = require('../../model/DocumentSession');
var Component = require('../../ui/Component');
var ContainerEditor = require('../../ui/ContainerEditor');
var createTestArticle = require('../fixtures/createTestArticle');
var createTestComponentRegistry = require('../fixtures/createTestComponentRegistry');

module.exports = function setupContainerEditor(fixture, el) {
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
  var app;
  if (el) {
    app = App.mount(el);
  } else {
    app = App.render();
    // faking a mounted scenario
    app.triggerDidMount();
  }
  return {
    documentSession: docSession,
    doc: doc,
    app: app
  };
};

