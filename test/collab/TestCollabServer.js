import CollabServer from '../../collab/CollabServer'

class TestCollabServer extends CollabServer {

  serializeMessage(msg) {
    return msg
  }

  deserializeMessage(msg) {
    return msg
  }

}

export default TestCollabServer
