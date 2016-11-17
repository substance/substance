class SaveHandlerStub {

  saveDocument(params, cb) {
    console.log('Simulating document save ...', params)
    cb(null)
  }

}

export default SaveHandlerStub
