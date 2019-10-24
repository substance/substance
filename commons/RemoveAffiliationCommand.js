import RemoveItemCommand from './_RemoveItemCommand'

export default class RemoveAuthorCommand extends RemoveItemCommand {
  getType () {
    return 'affiliation'
  }
}
