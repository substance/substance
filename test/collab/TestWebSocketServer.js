import EventEmitter from '../../util/EventEmitter'
import TestServerWebSocket from './TestServerWebSocket'

/*
  Local in-process Websocket server implementation for client-side development
  of protocols.
*/
class TestWebSocketServer extends EventEmitter {

  constructor(config) {
    super()

    this.messageQueue = config.messageQueue
    this.serverId = config.serverId || "server"
    this.clients = {}
    this._isSimulated = true

    if (!config.manualConnect) {
      this.connect()
    }
  }

  connect() {
    this.messageQueue.connectServer(this)
  }

  /*
    New websocket connection requested. Creates the server-side
    counterpart of the websocket and registers it in the message
    queue.
  */
  handleConnectionRequest(clientId) {
    // TODO: this implementation does not allow for multiple connections
    // from one client to a server and ATM we have only one server
    var sws = new TestServerWebSocket(
      this.messageQueue,
      this.serverId,
      clientId
    )
    this.messageQueue.connectServerSocket(sws)
    this.clients[clientId] = sws
    // Emit connection event
    this.emit('connection', sws)
  }

  /*
    Disconnect an existing websocket
  */
  handleDisconnectRequest(clientId) {
    var sws = this.clients[clientId]
    this.messageQueue.disconnectServerSocket(sws)

    // Emit close event on websocket server
    sws.emit('close', sws)
    delete this.clients[clientId]
  }

}

export default TestWebSocketServer
