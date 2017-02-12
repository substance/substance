import ChangeStore from './ChangeStore'
import SnapshotStore from './SnapshotStore'

/**
  Standard configuration for Substance CollabServer
*/
export default {
  name: 'collab-server',
  configure: function (config) {
    config.setChangeStore(new ChangeStore())
    config.setSnapshotStore(new SnapshotStore())
  }
}
