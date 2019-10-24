import MoveItemCommand from './_MoveItemCommand'

export default class MoveAuthorCommand extends MoveItemCommand {
  getType () {
    return 'affiliation'
  }
}
