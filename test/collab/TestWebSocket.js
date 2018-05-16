import EventEmitter from '../../util/EventEmitter'
import uuid from '../../util/uuid'
var __id__ = 0

/**
  Simple TestWebSocket implementation for local testing
*/

class TestWebSocket extends EventEmitter {
  constructor (config) {
    super()

    this.__id__ = __id__++
    this.messageQueue = config.messageQueue
    this.clientId = config.clientId || uuid()
    this.serverId = config.serverId || 'server'

    // We consider our TestWebSocket WebSocket.CLOSED at the beginning
    this.readyState = 3
    this._isSimulated = true
  }

  connect () {
    this.messageQueue.connectClientSocket(this)
    this.readyState = 1 // WebSocket.OPEN
    this.triggerOpen()
  }

  disconnect () {
    this.messageQueue.disconnectClientSocket(this)
    this.readyState = 3 // WebSocket.CLOSED
    this.triggerClose()
  }

  /*
    Emulating native addEventListener API
  */
  addEventListener (eventName, handler) {
    if (this['on' + eventName]) {
      // For simplicity we only support a single handler per event atm
      console.warn('on' + eventName, ' is already set. Overriding handler.')
    }
    this['on' + eventName] = handler
  }

  /*
    This can is called by the messageQueue once the connection is established
  */
  triggerOpen () {
    if (this.onopen) this.onopen()
  }

  triggerClose () {
    if (this.onclose) this.onclose()
  }

  /*
    Emulating native removeEventListener API
  */
  removeEventListener (eventName) {
    delete this['on' + eventName]
  }

  /**
    Gets called by the message queue to handle a message
  */
  _onMessage (data) {
    // Handler must be provided by user
    this.onmessage({data: data})
  }

  /**
    Gets called by the message queue to handle a message
  */
  send (data) {
    var msg = {
      from: this.clientId,
      to: this.serverId
    }
    if (data) {
      msg.data = data
    }
    this.messageQueue.pushMessage(msg)
  }
}

export default TestWebSocket
