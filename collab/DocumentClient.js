"use strict";

var oo = require('../util/oo');
var request = require('../util/request');

/*
  HTTP client for talking with DocumentServer
*/
function DocumentClient(config) {
  this.config = config;
}

DocumentClient.Prototype = function() {

  /*
    Create a new document on the server

    ```js
    @example
    ```

    documentClient.createDocument({
      schemaName: 'prose-article',
      info: {
        userId: 'userx'
      }
    });
  */
  this.createDocument = function(newDocument, cb) {
    request('POST', this.config.httpUrl, newDocument, cb);
  };

  /*
    Get a document from the server

    @example

    ```js
    documentClient.getDocument('mydoc-id');
    ```
  */

  this.getDocument = function(documentId, cb) {
    request('GET', this.config.httpUrl+documentId, null, cb);
  };

  /*
    Remove a document from the server

    @example

    ```js
    documentClient.deleteDocument('mydoc-id');
    ```
  */

  this.deleteDocument = function(documentId, cb) {
    request('DELETE', this.config.httpUrl+documentId, null, cb);
  };

};

oo.initClass(DocumentClient);

module.exports = DocumentClient;
