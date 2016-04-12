'use strict';

var Router = require('../ui/Router');

function DocumentationRouter(controller) {
  DocumentationRouter.super.call(this);

  this.controller = controller;
}

DocumentationRouter.Prototype = function() {

  this.stateFromRoute = function(route) {
    if (!route) {
      this.controller.setState(this.controller.getInitialState());
    } else {
      var nodeId = route;
      this.controller._focusNode(nodeId);
    }
  };

  this.routeFromState = function() {
    return this.controller.state.nodeId;
  };

};

Router.extend(DocumentationRouter);

module.exports = DocumentationRouter;
