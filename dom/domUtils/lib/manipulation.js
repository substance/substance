function removeElement(elem){
  if(elem.prev) elem.prev.next = elem.next;
  if(elem.next) elem.next.prev = elem.prev;
  if(elem.parent){
    var childs = elem.parent.childNodes;
    let pos = childs.lastIndexOf(elem)
    if (pos < 0) throw new Error('Invalid state')
    childs.splice(pos, 1);
    elem.parent = null
  }
}

function replaceElement(elem, replacement){
  if (replacement.parent) exports.removeElement(replacement)
  var prev = replacement.prev = elem.prev;
  if(prev){
    prev.next = replacement;
  }

  var next = replacement.next = elem.next;
  if(next){
    next.prev = replacement;
  }

  var parent = replacement.parent = elem.parent;
  if(parent){
    var childs = parent.childNodes;
    let pos = childs.lastIndexOf(elem)
    if (pos < 0) throw new Error('Invalid state')
    childs[pos] = replacement;
  }
}

function appendChild(elem, child){
  if (child.parent) removeElement(child)
  child.parent = elem;

  if(elem.childNodes.push(child) !== 1){
    var sibling = elem.childNodes[elem.childNodes.length - 2];
    sibling.next = child;
    child.prev = sibling;
    child.next = null;
  }
}

function append(elem, next){
  if (next.parent) removeElement(next)
  var parent = elem.parent,
    currNext = elem.next;

  next.next = currNext;
  next.prev = elem;
  elem.next = next;
  next.parent = parent;

  if(currNext){
    currNext.prev = next;
    if(parent){
      var childs = parent.childNodes;
      let pos = childs.lastIndexOf(currNext)
      if (pos < 0) throw new Error('Invalid state')
      childs.splice(pos, 0, next);
    }
  } else if(parent){
    parent.childNodes.push(next);
  }
}

function prepend(elem, prev){
  if (prev.parent) removeElement(prev)
  var parent = elem.parent;
  if(parent){
    var childs = parent.childNodes;
    let pos = childs.lastIndexOf(elem)
    if (pos < 0) throw new Error('Invalid state')
    childs.splice(pos, 0, prev);
  }

  if(elem.prev){
    elem.prev.next = prev;
  }

  prev.parent = parent;
  prev.prev = elem.prev;
  prev.next = elem;
  elem.prev = prev;
}

exports.removeElement = removeElement
exports.replaceElement = replaceElement
exports.appendChild = appendChild
exports.append = append
exports.prepend = prepend
