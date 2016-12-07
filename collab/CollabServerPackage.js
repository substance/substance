import ChangeStore from './ChangeStore'
import DocumentStore from './DocumentStore'
import SnapshotStore from './SnapshotStore'

/**
  Standard configuration for Substance CollabServer
*/
export default {
  name: 'collab-server',
  configure: function (config) {
    config.setChangeStore(new ChangeStore())
    config.setDocumentStore(new DocumentStore())
    config.setSnapshotStore(new SnapshotStore())
  }
}