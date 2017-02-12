class ServerResponse {
  constructor() {
    this.isReady = false // once the response has been set using send
    this.isEnhanced = false // after response has been enhanced by enhancer
    this.isSent = false // after response has been sent
    this.err = null
    this.data = null
  }

  /*
    Sends an error response

    @example

    ```js
    res.error({
      type: 'syncError',
      errorName: 'AuthenticationError',
      documentId: 'doc-1'
    });
    ```
  */
  error(err) {
    this.err = err
    this.isReady = true
  }

  /*
    Send response data
  */
  send(data) {
    this.data = data
    this.isReady = true
  }

  /*
    Sets the isEnhanced flag
  */
  setEnhanced() {
    this.isEnhanced = true
  }

  setSent() {
    this.isSent = true
  }
}

export default ServerResponse