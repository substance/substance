import getListTagName from './getListTagName'
import last from '../../util/last'

export default function renderListNode(node, rootEl, createElement) {
  let items = node.getItems()
  let stack = [rootEl]
  for (let i = 0; i < items.length; i++) {
    let item = items[i]
    if (item.level<stack.length) {
      for (let j = stack.length; j > item.level; j--) {
        stack.pop()
      }
    } else if (item.level>stack.length) {
      for (let j = stack.length; j < item.level; j++) {
        // Note: ATM all sublists have the same order type
        let sublist = createElement(getListTagName(node))
        last(stack).append(sublist)
        stack.push(sublist)
      }
    }
    console.assert(item.level === stack.length, 'item.level should now be the same as stack.length')
    last(stack).append(
      createElement(item)
    )
  }
  for(let j=stack.length; j>1;j--) {
    stack.pop()
  }
}