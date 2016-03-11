  // /*
  //   Create snapshot for a given document
  // */
  // this._createSnapshot = function(id, version, cb) {
  //   var self = this;

  //   this._getDocument(id, function(err, docData) {
  //     if(err) return cb(err);

  //     var schemaConfig = self.config.schemas[docData.schemaName];
      
  //     if (!schemaConfig) {
  //       cb(new Error('Schema ' + docData.schemaName + ' not found'));
  //     }

  //     var req = {
  //       documentId: id,
  //       sinceVersion: docData.version || 0
  //     };

  //     self.getChanges(req, function(err, res) {
  //       if(err) return cb(err);
        
  //       var doc;
  //       var converter = new JSONConverter();
  //       var docFactory = schemaConfig.documentFactory;

  //       if(docData.version > 0) {
  //         var jsonSnapshot = JSON.parse(docData.snapshot);
  //         doc = new docFactory.ArticleClass();
  //         doc = converter.importDocument(doc, jsonSnapshot);
  //       } else {
  //         doc = docFactory.createEmptyArticle();
  //       }

  //       _.each(res.changes, function(change) {
  //         _.each(change.ops, function(op){
  //           // doc here should be already restored
  //           doc.data.apply(op);
  //         });
  //       });
        
  //       // doc here should be already restored
  //       var snapshot = converter.exportDocument(doc);
  //       self._updateSnapshot(id, snapshot, version, cb);
  //     });
  //   });
  // };

  // /*
  //   Update document record with new snapshot and version number
  // */
  // this._updateSnapshot = function(id, snapshot, version, cb) {
  //   var query = this.db('documents')
  //               .where('documentId', id)
  //               .update({
  //                 snapshot: JSON.stringify(snapshot),
  //                 version: version
  //               });

  //   query.asCallback(cb);
  // };


  //   /*
  //   Request creation of new snapshot

  //   Will create new snapshot only during document
  //   creation or in case if version is divisible
  //   by frequency constant

  //   @param {Object} args arguments
  //   @param {String} args.documentId document id
  //   @param {String} args.version document version from change
  //   @param {Function} cb callback
  // */
  // this.requestSnapshotCreation = function(args, cb) {
  //   var frequency = this.config.snapshotFrequency;
  //   if(args.version % frequency !== 0 && args.version !== 1) return cb(null);
  //   this._createSnapshot(args.documentId, args.version, cb);
  // };