import EditingInterface from '../model/EditingInterface'

export default class XMLEditingInterface extends EditingInterface {

  find(cssSelector) {
    return this.getDocument().find(cssSelector)
  }

  findAll(cssSelector) {
    return this.getDocument().findAll(cssSelector)
  }

  createElement(...args) {
    return this.getDocument().createElement(...args)
  }

}