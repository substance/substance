import CollabSession from '../../collab/CollabSession'
import DocumentChange from '../../model/DocumentChange'

class TestCollabSession extends CollabSession {
  constructor (...args) {
    super(...args)
    this._incomingMessages = []
    this._outgoingMessages = []
  }

  /*
    We log received messages so we can later dump the session
    history and replay in test cases.
  */
  _onMessage (...args) {
    if (this.config.logging) {
      this._incomingMessages.push(args[0])
    }
    super._onMessage(...args)
  }

  /*
    We log sent messages so we can later dump the session
    history and replay in test cases.
  */
  _onSend (...args) {
    if (this.config.logging) {
      this._outgoingMessages = []
      this._outgoingMessages.push(args[0])
    }
    super._onSend(...args)
  }

  dumpIncomingMessages () {
    return JSON.stringify(this._incomingMessages, null, '  ')
  }

  dumpOutgoingMessages () {
    return JSON.stringify(this._outgoingMessages, null, '  ')
  }

  serializeMessage (msg) {
    return msg
  }

  deserializeMessage (msg) {
    return msg
  }

  serializeChange (change) {
    return change.toJSON()
  }

  deserializeChange (serializedChange) {
    return DocumentChange.fromJSON(serializedChange)
  }
}

export default TestCollabSession
