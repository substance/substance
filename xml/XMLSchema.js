export default class XMLSchema {

  constructor(elementSchemas) {
    this._elementSchemas = elementSchemas
  }

  getTagNames() {
    return Object.keys(this._elementSchemas)
  }

  getElementSchema(name) {
    return this._elementSchemas[name]
  }
}