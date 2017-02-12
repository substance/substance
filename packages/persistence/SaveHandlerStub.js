class SaveHandlerStub {

  /*
    Saving a document involves two steps.

    - syncing files (e.g. images) with a backend
    - storing a snapshot of the document's content (e.g. a XML serialization)
  */
  saveDocument({fileManager}) {
    console.info('Simulating save ...')

    return fileManager.sync()
    .then(() => {
      // Here you would run a converter (HTML/XML) usually
      // and send the result to a REST endpoint.
      console.info('Creating document snapshot...')
    })

  }
}

export default SaveHandlerStub
