import EventEmitter from '../../util/EventEmitter'

var __id__ = 0

/**
  Simple TestServerWebSocket implementation for local testing
*/

export default class TestServerWebSocket extends EventEmitter {
  constructor (messageQueue, serverId, clientId) {
    super()

    this.__id__ = __id__++
    this.messageQueue = messageQueue
    this.serverId = serverId
    this.clientId = clientId

    this._isSimulated = true
    this.readyState = 1 // consider always connected
  }

  connect () {
    this.messageQueue.connectServerSocket(this)
  }

  /**
    Gets called by the message queue to handle a message
  */
  _onMessage (data) {
    this.emit('message', data)
  }

  /**
    Gets called by the message queue to handle a message
  */
  send (data) {
    var msg = {
      from: this.serverId,
      to: this.clientId
    }
    if (data) {
      // msg.data = JSON.parse(data)
      msg.data = data
    }
    this.messageQueue.pushMessage(msg)
  }
}
