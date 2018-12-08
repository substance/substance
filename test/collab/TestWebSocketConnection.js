import ClientConnection from '../../collab/ClientConnection'
import TestWebSocket from './TestWebSocket'

/*
  Browser WebSocket abstraction. Handles reconnects etc.
*/
export default class TestWebSocketConnection extends ClientConnection {
  _createWebSocket () {
    // this.config has messageQueue, clientId, serverId
    var ws = new TestWebSocket(this.config)
    return ws
  }

  /*
    Manual connect
  */
  connect () {
    this._connect()
  }

  /*
    Manual disconnect
  */
  disconnect () {
    this._disconnect()
  }

  _connect (...args) {
    // Create websocket and bind events open/close/message
    super._connect(...args)
    // connects websocket to the messageQueue and triggers 'open' event
    this.ws.connect()
  }

  _disconnect (...args) {
    this.ws.disconnect()
    super._disconnect(...args)
  }

  _onConnectionClose () {
    this.emit('close')
  }

  /*
    Our message queue holds JS objects already so we just
    pass through the msg
  */
  serializeMessage (msg) {
    return msg
  }

  deserializeMessage (msg) {
    return msg
  }
}
