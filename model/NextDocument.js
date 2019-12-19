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

  fromXml (xmlStr, context) {
    this._nextSchema.importDocumentFromXml(this, xmlStr, context)
    return this
  }

  fromJson (json) {
    super.fromJson(json)
    // making sure that root points to the correct node, in case the root node has been overwritten
    this.root = this.get(this.root.id)
    return this
  }

  toXml (context, options) {
    return this._nextSchema.exportDocumentToXml(this, context, options)
  }
}
