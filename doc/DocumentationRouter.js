'use strict';

var Router = require('../ui/Router');

function DocumentationRouter(controller) {
  DocumentationRouter.super.call(this);
  this.controller = controller;
}

DocumentationRouter.Prototype = function() {

  this.parseRoute = function(route) {
    if (!route) {
      return this.controller.getInitialState();
    } else {
      // var nodeId = route;
      return {
        nodeId: route
      };
    }
  };

  this.stringifyRoute = function() {
    return this.controller.state.nodeId;
  };

};

Router.extend(DocumentationRouter);

module.exports = DocumentationRouter;
