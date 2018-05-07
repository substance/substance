import last from '../../util/last'

const DEFAULT_LEVEL_SPEC = 'unordered'

export default function renderListNode(node, $$) {
  let levelSpecs = node.getLevelSpecs() || []
  let items = node.getItems()
  let stack = [$$(_getTagName(0))]
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const level = item.level
    if (level < stack.length) {
      for (let j = stack.length; j > level; j--) {
        stack.pop()
      }
    } else if (level > stack.length) {
      for (let j = stack.length; j < level; j++) {
        let sublist = $$(_getTagName(j))
        last(stack).append(sublist)
        stack.push(sublist)
      }
    }
    console.assert(level === stack.length, 'item.level should now be the same as stack.length')
    last(stack).append(
      $$(item)
    )
  }
  for(let j=stack.length; j>1;j--) {
    stack.pop()
  }

  return stack[0]

  function _getLevelSpec(level) {
    let spec = levelSpecs[level]
    if (!spec) {
      for(let i = level-1; i>=0; i--) {
        spec = levelSpecs[i]
        if (spec) break
      }
      spec = spec || DEFAULT_LEVEL_SPEC
      levelSpecs[level] = spec
    }
    return spec
  }
  function _getTagName(level) {
    let spec = _getLevelSpec(level)
    return spec === 'ordered' ? 'ol' : 'ul'
  }
}
