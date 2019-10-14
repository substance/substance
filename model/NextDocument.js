import Document from './Document'

export default class NextDocument extends Document {
  constructor (documentSchema, nextSchema) {
    super(documentSchema)

    this._nextSchema = nextSchema
    const rootType = nextSchema.rootType
    // for the root node id is always === type
    this.root = this.create({ type: rootType, id: rootType })
  }

  find (cssSelector) {
    if (this.root) {
      return this.root.find(cssSelector)
    }
  }

  findAll (cssSelector) {
    if (this.root) {
      return this.root.findAll(cssSelector)
    }
  }

  newInstance () {
    return new NextDocument(this.schema, this._nextSchema)
  }

  fromXml (xmlStr) {
    this._nextSchema.importDocumentFromXml(this, xmlStr)
    return this
  }

  toXml () {
    return this._nextSchema.exportDocumentToXml(this)
  }
}
