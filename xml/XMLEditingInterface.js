import { EditingInterface } from '../model'

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