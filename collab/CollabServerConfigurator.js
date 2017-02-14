import DocumentEngine from './DocumentEngine'
import Configurator from '../util/Configurator'
import buildJSONSnapshot from './buildJSONSnapshot'

class CollabServerConfigurator extends Configurator {
  constructor(...args) {
    super(...args)
    this.config = Object.assign(this.config, {
      heartbeat: 30*1000,
      documentStore: undefined,
      changeStore: undefined,
      snapshotStore: undefined,
      snapshotBuilderFn: buildJSONSnapshot
    })
  }

  setHost(host) {
    this.config.host = host
  }

  setPort(port) {
    this.config.port = port
  }

  // Record phase API
  // ------------------------

  setDocumentStore(documentStore) {
    this.config.documentStore = documentStore
  }

  setChangeStore(changeStore) {
    this.config.changeStore = changeStore
  }

  setSnapshotStore(snapshotStore) {
    this.config.snapshotStore = snapshotStore
  }

  setSnapshotBuilder(snapshotBuilderFn) {
    this.config.snapshotBuilderFn = snapshotBuilderFn
  }

  // Config Interpreter API
  // ------------------------

  getHost() {
    return this.config.host
  }

  getPort() {
    return this.config.port
  }

  getDocumentStore() {
    return this.config.documentStore
  }

  getChangeStore() {
    return this.config.changeStore
  }

  getSnapshotStore() {
    return this.config.snapshotStore
  }

  getSnapshotBuilder() {
    return this.config.snapshotBuilderFn
  }

  /*
    TODO: We should discuss if it is a good idea that the configurator 'owns'
    instances. Don't see a better solution for now though.
  */
  getDocumentEngine() {
    if (!this.documentEngine) {
      this.documentEngine = new DocumentEngine({
        snapshotBuilder: this.config.snapshotBuilderFn,
        documentStore: this.config.documentStore,
        changeStore: this.config.changeStore,
        snapshotStore: this.config.snapshotStore
      })
    }
    return this.documentEngine
  }

}

export default CollabServerConfigurator
