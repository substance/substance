import EditingInterface from './EditingInterface'

export default class ChangeRecorder extends EditingInterface {
  constructor (doc) {
    super(doc.clone())
  }

  generateChange () {
    const doc = this.getDocument()
    const ops = doc._ops.slice()
    doc._ops.length = 0
    let change = doc._createDocumentChange(ops, {}, {})
    change._extractInformation(doc)
    return change
  }
}
