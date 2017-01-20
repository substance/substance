class ServerRequest {
  constructor(message, ws) {
    this.message = message
    this.ws = ws
    this.isAuthenticated = false
    this.isAuhorized = false
  }

  /*
    Marks a request as authenticated
  */
  setAuthenticated(session) {
    this.isAuthenticated = true
    this.session = session
  }

  /*
    Marks a request as authorized (authorizationData is optional)
  */
  setAuthorized(authorizationData) {
    this.isAuthorized = true
    this.authorizationData = authorizationData
  }

  /*
    Sets the isEnhanced flag
  */
  setEnhanced() {
    this.isEnhanced = true
  }
}

export default ServerRequest