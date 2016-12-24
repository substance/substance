import DocumentEngine from './DocumentEngine'

class CollabServerConfigurator {
  constructor() {
    this.config = {
      heartbeat: 30*1000,
      documentStore: undefined,
      changeStore: undefined,
      snapshotStore: undefined
    }
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

  /*
    TODO: We should discuss if it is a good idea that the configurator 'owns'
    instances. Don't see a better solution for now though.
  */
  getDocumentEngine() {
    if (!this.documentEngine) {
      this.documentEngine = new DocumentEngine({
        documentStore: this.config.documentStore,
        changeStore: this.config.changeStore,
        snapshotStore: this.config.snapshotStore
      })
    }
    return this.documentEngine
  }

  /**
    Configure this instance of configuration for provided package.
    @param  {Object} pkg     Object should contain a `configure` method that
                             takes a Configurator instance as the first method.
    @param  {Object} options Additional options to pass to the
                             package.`configure` method

    @return {configurator}   returns the configurator instance to make it easy
                             to chain calls to import.
   */
  import(pkg, options) {
    pkg.configure(this, options || {})
    return this
  }

}

export default CollabServerConfigurator
