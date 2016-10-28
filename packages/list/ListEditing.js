class ListEditing {

  register(editing) {
    editing.defineMerge('list', 'textish', this.mergeListText)
    editing.defineMerge('textish', 'list', this.mergeTextList)
    editing.defineMerge('list', 'list', this.mergeListList)
  }

  mergeListText(tx, args) {
    console.log('TODO: merge text into list')
    return args
  }

  mergeTextList(tx, args) {
    console.log('TODO: merge list into text')
    return args
  }

  mergeListList(tx, args) {
    console.log('TODO: merge list into list')
    return args
  }

}

let listEditing = new ListEditing()

export default listEditing