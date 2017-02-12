import EventEmitter from '../util/EventEmitter'

/**
  Client for CollabServer API

  Communicates via websocket for real-time operations
*/
class CollabClient extends EventEmitter {
  constructor(config) {
    super()

    this.config = config
    this.connection = config.connection

    // Hard-coded for now
    this.scope = 'substance/collab'

    // Bind handlers
    this._onMessage = this._onMessage.bind(this)
    this._onConnectionOpen = this._onConnectionOpen.bind(this)
    this._onConnectionClose = this._onConnectionClose.bind(this)

    // Connect handlers
    this.connection.on('open', this._onConnectionOpen)
    this.connection.on('close', this._onConnectionClose)
    this.connection.on('message', this._onMessage)
  }

  _onConnectionClose() {
    this.emit('disconnected')
  }

  _onConnectionOpen() {
    this.emit('connected')
  }

  /*
    Delegate incoming messages from the connection
  */
  _onMessage(msg) {
    if (msg.scope === this.scope) {
      this.emit('message', msg);
    } else if (msg.scope !== '_internal') {
      console.info('Message ignored. Not sent in hub scope', msg);
    }
  }

  /*
    Send message via websocket channel
  */
  send(msg) {
    if (!this.connection.isOpen()) {
      console.warn('Message could not be sent. Connection not open.', msg)
      return
    }

    msg.scope = this.scope;
    if (this.config.enhanceMessage) {
      msg = this.config.enhanceMessage(msg)
    }
    this.connection.send(msg)
  }

  /*
    Returns true if websocket connection is open
  */
  isConnected() {
    return this.connection.isOpen()
  }

  dispose() {
    this.connection.off(this)
  }
}

export default CollabClient
