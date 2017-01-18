import uuid from '../util/uuid'
import EventEmitter from '../util/EventEmitter'
import ServerRequest from './ServerRequest'
import ServerResponse from './ServerResponse'

/**
  Server

  Implements a generic layered architecture
*/
class Server extends EventEmitter {
  constructor(config) {
    super()

    this.config = config
    this._onConnection = this._onConnection.bind(this)
  }

  bind(wss) {
    if (this.wss) {
      throw new Error('Server is already bound to a websocket')
    }
    this.wss = wss
    this._connections = new WeakMap()
    this._collaborators = {}
    this.wss.on('connection', this._onConnection)

    let interval = this.config.heartbeat
    if (interval) {
      this._heartbeat = setInterval(this._sendHeartbeat.bind(this), interval)
    }
    this._bound = true
  }

  /*
    NOTE: This method is yet untested
  */
  unbind() {
    if (this._bound) {
      this.wss.off('connection', this._onConnection)
    } else {
      throw new Error('Server is not yet bound to a websocket.')
    }
  }

  /*
    Hook called when a collaborator connects
  */
  onConnection(/*collaboratorId*/) {
    // noop
  }

  /*
    Hook called when a collaborator disconnects
  */
  onDisconnect(/*collaboratorId*/) {
    // noop
  }

  /*
    Stub implementation for authenticate middleware.

    Implement your own as a hook
  */
  authenticate(req, res) {
    req.setAuthenticated()
    this.next(req, res)
  }

  /*
    Stub implementation for authorize middleware

    Implement your own as a hook
  */
  authorize(req, res) {
    req.setAuthorized()
    this.next(req, res)
  }


  /*
    Ability to enrich the request data
  */
  enhanceRequest(req, res) {
    req.setEnhanced()
    this.next(req, res)
  }

  /*
    Executes the API according to the message type

    Implement your own as a hook
  */
  execute(/*req, res*/) {
    throw new Error('This method needs to be specified')
  }

  /*
    Ability to enrich the response data
  */
  enhanceResponse(req, res) {
    res.setEnhanced()
    this.next(req, res)
  }

  /*
    When a new collaborator connects we generate a unique id for them
  */
  _onConnection(ws) {
    let collaboratorId = uuid()
    let connection = {
      collaboratorId: collaboratorId
    }
    this._connections.set(ws, connection)

    // Mapping to find connection for collaboratorId
    this._collaborators[collaboratorId] = {
      connection: ws
    }

    ws.on('message', this._onMessage.bind(this, ws))
    ws.on('close', this._onClose.bind(this, ws))
  }

  /*
    When websocket connection closes
  */
  _onClose(ws) {
    let conn = this._connections.get(ws)
    let collaboratorId = conn.collaboratorId

    this.onDisconnect(collaboratorId)

    // Remove the connection records
    delete this._collaborators[collaboratorId]
    this._connections.delete(ws)
  }

  /*
    Implements state machine for handling the request response cycle

    __initial -        > authenticated      -> __authenticated, __error
    __authenticated   -> authorize          -> __authorized, __error
    __authorized      -> enhanceRequest     -> __requestEnhanced, __error
    __requestEnhanced -> execute            -> __executed, __error
    __executed        -> enhanceResponse    -> __enhanced, __error
    __enhanced        -> sendResponse       -> __done, __error
    __error           -> sendError          -> __done
    __done // end state
  */
  __initial(req, res) {
    return !req.isAuthenticated && !req.isAuthorized && !res.isReady
  }

  __authenticated(req, res) {
    return req.isAuthenticated && !req.isAuthorized && !res.isReady
  }

  __authorized(req, res) {
    return req.isAuthenticated && req.isAuthorized && !req.isEnhanced && !res.isReady
  }

  __requestEnhanced(req, res) {
    return req.isAuthenticated && req.isAuthorized && req.isEnhanced && !res.isReady
  }

  __executed(req, res) {
    // excecute must call res.send() so res.data is set
    return req.isAuthenticated && req.isAuthorized && res.isReady && res.data && !res.isEnhanced
  }

  __enhanced(req, res) {
    return res.isReady && res.isEnhanced && !res.isSent
  }

  __error(req, res) {
    return res.err && !res.isSent
  }

  __done(req, res) {
    return res.isSent
  }

  next(req, res) {
    if (this.__initial(req, res)) {
      this.authenticate(req, res)
    } else if (this.__authenticated(req, res)) {
      this.authorize(req, res)
    } else if (this.__authorized(req, res)) {
      this.enhanceRequest(req, res)
    } else if (this.__requestEnhanced(req, res)) {
      this.execute(req, res)
    } else if (this.__executed(req, res)) {
      this.enhanceResponse(req, res)
    } else if (this.__enhanced(req, res)) {
      this.sendResponse(req, res)
    } else if (this.__error(req, res)) {
      this.sendError(req, res)
    } else if (this.__done(req,res)) {
      // console.log('We are done with processing the request.');
    }
  }

  /*
    Send error response
  */
  sendError(req, res) {
    let collaboratorId = req.message.collaboratorId
    let msg = res.err
    this.send(collaboratorId, msg)
    res.setSent()
    this.next(req, res)
  }

  /*
    Sends a heartbeat message to all connected collaborators
  */
  _sendHeartbeat() {
    Object.keys(this._collaborators).forEach(function(collaboratorId) {
      this.send(collaboratorId, {
        type: 'highfive',
        scope: '_internal'
      });
    }.bind(this))
  }

  /*
    Send response
  */
  sendResponse(req, res) {
    let collaboratorId = req.message.collaboratorId
    this.send(collaboratorId, res.data)
    res.setSent()
    this.next(req, res)
  }

  _isWebsocketOpen(ws) {
    return ws && ws.readyState === 1
  }

  /*
    Send message to collaborator
  */
  send(collaboratorId, message) {
    if (!message.scope && this.config.scope) {
      message.scope = this.config.scope
    }

    let ws = this._collaborators[collaboratorId].connection
    if (this._isWebsocketOpen(ws)) {
      ws.send(this.serializeMessage(message))
    } else {
      console.error('Server#send: Websocket for collaborator', collaboratorId, 'is no longer open', message)
    }
  }

  /*
    Send message to collaborator
  */
  broadCast(collaborators, message) {
    collaborators.forEach(function(collaboratorId) {
      this.send(collaboratorId, message)
    }.bind(this))
  }

  // Takes a request object
  _processRequest(req) {
    let res = new ServerResponse()
    this.next(req, res)
  }

  /*
    Handling of client messages.

    Message comes in in the following format:

    We turn this into a method call internally:

    this.open(ws, 'doc13')

    The first argument is always the websocket so we can respond to messages
    after some operations have been performed.
  */
  _onMessage(ws, msg) {
    // Retrieve the connection data
    let conn = this._connections.get(ws)
    msg = this.deserializeMessage(msg)

    if (msg.scope === this.scope) {
      // We attach a unique collaborator id to each message
      msg.collaboratorId = conn.collaboratorId
      let req = new ServerRequest(msg, ws)
      this._processRequest(req)
    }
  }

  serializeMessage(msg) {
    return JSON.stringify(msg)
  }

  deserializeMessage(msg) {
    return JSON.parse(msg)
  }

}

export default Server
