import CollabServer from '../../collab/CollabServer'

class TestCollabServer extends CollabServer {

  constructor(config) {
    super(config)

    this.config.scope = 'substance/collab'
  }

  serializeMessage(msg) {
    return msg
  }

  deserializeMessage(msg) {
    return msg
  }

}

export default TestCollabServer
