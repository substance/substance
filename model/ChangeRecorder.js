import EditingInterface from './EditingInterface'
import DocumentChange from './DocumentChange'

export default
class ChangeRecorder extends EditingInterface {
  constructor (doc) {
    super(doc.clone())
  }

  generateChange () {
    const doc = this.getDocument()
    const ops = doc._ops.slice()
    doc._ops.length = 0
    let change = new DocumentChange(ops, {}, {})
    change._extractInformation(doc)
    return change
  }
}
