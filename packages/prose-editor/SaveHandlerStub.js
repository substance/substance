import oo from '../../util/oo'

class SaveHandlerStub {

  saveDocument(doc, changes, cb) {
    console.warn('No SaveHandler provided. Using Stub.')
    cb(null)
  }
}

oo.initClass(SaveHandlerStub)

export default SaveHandlerStub
