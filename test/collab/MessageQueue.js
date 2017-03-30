import { EventEmitter } from 'substance'

/**
  Websocket server implementation for client-side development of protocols
*/

class MessageQueue extends EventEmitter {

  constructor() {
    super()

    this.connections = {}
    this.messages = []
    this._log = []
  }

  /*
    Starts queue processing
  */
  start() {
    this._interval = setInterval(this._processMessage.bind(this), 100)
  }

  /*
    Stops the queue processing
  */
  stop() {
    clearInterval(this._interval)
  }

  flush() {
    while (this.messages.length) {
      this._processMessage()
    }
  }

  clear() {
    this.messages = []
  }

  tick() {
    this._processMessage()
  }

  connectServer(server) {
    if(this.connections[server.serverId]) {
      throw new Error('Server already registered:' + server.serverId)
    }
    this.connections[server.serverId] = {
      type: 'server',
      serverId: server.serverId,
      server : server,
      sockets: {}
    }
  }

  /*
    A new client connects to the message queue
  */
  connectClientSocket(ws) {
    var serverId = ws.serverId
    var clientId = ws.clientId
    var conn = this.connections[serverId]
    if (!conn || conn.type !== "server") {
      throw new Error('Can not connect to server. Unknown server id.')
    }
    this.connections[ws.clientId] = {
      type: 'client',
      socket: ws
    }
    conn.server.handleConnectionRequest(clientId)
  }

  /*
    A client disconnects from the message queue
  */
  disconnectClientSocket(ws) {
    var serverId = ws.serverId
    var clientId = ws.clientId
    var conn = this.connections[serverId]

    if (!conn || conn.type !== "server") {
      throw new Error('Unknown server id.')
    }
    conn.server.handleDisconnectRequest(clientId)
    delete this.connections[ws.clientId]
  }

  /*
    This is called by the server as a response to
    connection:requested. ws is the server-side end of
    the communication channel
  */
  connectServerSocket(ws) {
    var server = this.connections[ws.serverId]
    if (!server) {
      throw new Error('Server is not connected:' + ws.serverId)
    }
    server.sockets[ws.clientId] = ws
  }

  /*
    This is called by the server.

    Really needed? Isn't this done already in TestWebSocketServer?
  */
  disconnectServerSocket(ws) {
    var server = this.connections[ws.serverId]
    if (!server) {
      throw new Error('Server is not connected:' + ws.serverId)
    }
    delete server.sockets[ws.clientId]
  }

  /*
    Adds a message to the queue
  */
  pushMessage(message) {
    this.messages.push(message)
    this._log.push(message)
    this.emit('messages:updated', this.messages)
  }

  /*
    Takes one message off the queue and delivers it to the recipient
  */
  _processMessage() {
    var message = this.messages.shift()
    if (!message) return; // nothing to process
    this.emit('messages:updated', this.messages)
    var from = message.from
    var to = message.to
    var recipient = this.connections[to]
    var socket
    if (recipient.type === "server") {
      socket = recipient.sockets[from]
    } else {
      socket = recipient.socket
    }
    if (!socket) {
      console.error('Could not deliver message:', message)
    } else {
      socket._onMessage(message.data)
    }
    this.emit('message:sent', message)
  }
}

export default MessageQueue
