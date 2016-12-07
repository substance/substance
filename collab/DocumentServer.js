
/*
  DocumentServer module. Can be bound to an express instance
*/
class DocumentServer {

  constructor(params) {
    this.configurator = params.configurator
    this.engine = this.configurator.getDocumentEngine()
    // TODO: make path configurable through configurator
    this.path = '/api/documents'
  }

  /*
    Attach this server to an express instance
  */
  bind(app) {
    app.post(this.path, this._createDocument.bind(this))
    app.get(this.path + '/:id', this._getDocument.bind(this))
    app.delete(this.path + '/:id', this._deleteDocument.bind(this))
  }

  /*
    Create a new document, given a schemaName and schemaVersion
  */
  _createDocument(req, res, next) {
    let args = req.body
    let newDoc = {
      schemaName: args.schemaName, // e.g. prose-article
      info: args.info // optional
    }

    this.engine.createDocument(newDoc, function(err, result) {
      if (err) return next(err)
      res.json(result)
    })
  }

  /*
    Get a document with given document id
  */
  _getDocument(req, res, next) {
    let documentId = req.params.id
    this.engine.getDocument({
      documentId: documentId
    }, function(err, result) {
      if (err) return next(err)
      res.json(result)
    })
  }

  /*
    Remove a document with given document id
  */
  _deleteDocument(req, res, next) {
    let documentId = req.params.id
    this.engine.deleteDocument(documentId, function(err, result) {
      if (err) return next(err)
      res.json(result)
    })
  }
}

export default DocumentServer
