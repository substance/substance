import TransactionDocument from './TransactionDocument'
import EditingInterface from './EditingInterface'
import DocumentChange from './DocumentChange'

export default
class ChangeRecorder extends EditingInterface {

  constructor(doc) {
    super(new TransactionDocument(doc))
  }

  generateChange() {
    const ops = this._document.ops.slice()
    this._document.ops.length = 0
    let change = new DocumentChange(ops, {}, {})
    change._extractInformation(this._document)
    return change
  }

}