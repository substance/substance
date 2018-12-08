import CollabServer from '../../collab/CollabServer'

export default class TestCollabServer extends CollabServer {
  constructor (config) {
    super(config)

    this.config.scope = 'substance/collab'
  }

  serializeMessage (msg) {
    return msg
  }

  deserializeMessage (msg) {
    return msg
  }
}
