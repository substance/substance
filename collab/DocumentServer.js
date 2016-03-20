'use strict';

var oo = require('../util/oo');

/*
  DocumentServer module. Can be bound to an express instance
*/
function DocumentServer(config) {
  this.engine = config.documentEngine;
  this.path = config.path;
}

DocumentServer.Prototype = function() {

  /*
    Attach this server to an express instance
  */
  this.bind = function(app) {
    app.get(this.path + '/:id', this._getDocument.bind(this));
    app.post(this.path, this._createDocument.bind(this));
  };

  /*
    Generate new loginKey for user and send email with a link
  */
  this._getDocument = function(req, res, next) {
    var documentId = req.params.id;
    this.engine.getDocument({
      documentId: documentId
    }, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  };

  /*
    Create a new document, given a schemaName and schemaVersion
  */
  this._createDocument = function(req, res, next) {
    var args = req.body;
    var newDoc = {
      schemaName: args.schemaName, // e.g. prose-article
      info: args.info // optional
    };

    this.engine.createDocument(newDoc, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  };
};

oo.initClass(DocumentServer);
module.exports = DocumentServer;