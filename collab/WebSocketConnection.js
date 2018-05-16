import ClientConnection from './ClientConnection'

/**
  Browser WebSocket abstraction. Handles reconnects etc.
*/
class WebSocketConnection extends ClientConnection {
  _createWebSocket () {
    return new window.WebSocket(this.config.wsUrl)
  }
}

export default WebSocketConnection
