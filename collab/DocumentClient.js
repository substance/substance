import request from '../util/request'

/*
  HTTP client for talking with DocumentServer
*/
class DocumentClient {
  constructor(config) {
    this.config = config
  }

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
  createDocument(newDocument, cb) {
    request('POST', this.config.httpUrl, newDocument, cb)
  }

  /*
    Get a document from the server

    @example

    ```js
    documentClient.getDocument('mydoc-id');
    ```
  */

  getDocument(documentId, cb) {
    request('GET', this.config.httpUrl+documentId, null, cb)
  }

  /*
    Remove a document from the server

    @example

    ```js
    documentClient.deleteDocument('mydoc-id');
    ```
  */

  deleteDocument(documentId, cb) {
    request('DELETE', this.config.httpUrl+documentId, null, cb)
  }

}

export default DocumentClient
