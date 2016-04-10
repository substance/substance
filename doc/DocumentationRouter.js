'use strict';

var Router = require('../ui/_Router');

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
    var nodeId = this.controller.state.nodeId;
    if (nodeId) {
      this.setRoute(nodeId);
    } else {
      this.clearRoute();
    }
  };

};

Router.extend(DocumentationRouter);

module.exports = DocumentationRouter;
