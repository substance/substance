import EventEmitter from '../util/EventEmitter'
import Err from '../util/SubstanceError'

/**
  ClientConnection abstraction. Uses websockets internally
*/
class ClientConnection extends EventEmitter {
  constructor(config) {
    super()

    this.config = config
    this._onMessage = this._onMessage.bind(this)
    this._onConnectionOpen = this._onConnectionOpen.bind(this)
    this._onConnectionClose = this._onConnectionClose.bind(this)

    // Establish websocket connection
    this._connect()
  }

  _createWebSocket() {
    throw Err('AbstractMethodError')
  }

  /*
    Initializes a new websocket connection
  */
  _connect() {
    this.ws = this._createWebSocket()
    this.ws.addEventListener('open', this._onConnectionOpen)
    this.ws.addEventListener('close', this._onConnectionClose)
    this.ws.addEventListener('message', this._onMessage)
  }

  /*
    Disposes the current websocket connection
  */
  _disconnect() {
    this.ws.removeEventListener('message', this._onMessage)
    this.ws.removeEventListener('open', this._onConnectionOpen)
    this.ws.removeEventListener('close', this._onConnectionClose)
    this.ws = null
  }

  /*
    Emits open event when connection has been established
  */
  _onConnectionOpen() {
    this.emit('open')
  }

  /*
    Trigger reconnect on connection close
  */
  _onConnectionClose() {
    this._disconnect()
    this.emit('close')
    console.info('websocket connection closed. Attempting to reconnect in 5s.')
    setTimeout(function() {
      this._connect()
    }.bind(this), 5000)
  }

  /*
    Delegate incoming websocket messages
  */
  _onMessage(msg) {
    msg = this.deserializeMessage(msg.data)
    this.emit('message', msg)
  }

  /*
    Send message via websocket channel
  */
  send(msg) {
    if (!this.isOpen()) {
      console.warn('Message could not be sent. Connection is not open.', msg)
      return
    }
    this.ws.send(this.serializeMessage(msg))
  }

  /*
    Returns true if websocket connection is open
  */
  isOpen() {
    return this.ws && this.ws.readyState === 1
  }

  serializeMessage(msg) {
    return JSON.stringify(msg)
  }

  deserializeMessage(msg) {
    return JSON.parse(msg)
  }

}

export default ClientConnection
