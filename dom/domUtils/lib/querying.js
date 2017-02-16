var isTag = require("domelementtype").isTag;

module.exports = {
  filter: filter,
  find: find,
  findOneChild: findOneChild,
  findOne: findOne,
  existsOne: existsOne,
  findAll: findAll
};

function filter(test, element, recurse, limit){
  if(!Array.isArray(element)) element = [element];

  if(typeof limit !== "number" || !isFinite(limit)){
    limit = Infinity;
  }
  return find(test, element, recurse !== false, limit);
}

function find(test, elems, recurse, limit){
  var result = [], childs;

  for(var i = 0, j = elems.length; i < j; i++){
    if(test(elems[i])){
      result.push(elems[i]);
      if(--limit <= 0) break;
    }

    childs = elems[i].childNodes;
    if(recurse && childs && childs.length > 0){
      childs = find(test, childs, recurse, limit);
      result = result.concat(childs);
      limit -= childs.length;
      if(limit <= 0) break;
    }
  }

  return result;
}

function findOneChild(test, elems){
  for(var i = 0, l = elems.length; i < l; i++){
    if(test(elems[i])) return elems[i];
  }

  return null;
}

function findOne(test, elems){
  var elem = null;

  for(var i = 0, l = elems.length; i < l && !elem; i++){
    const child = elems[i]
    if(!isTag(child)){
      continue;
    } else if(test(child)){
      elem = child;
    } else if(child.childNodes.length > 0){
      elem = findOne(test, child.childNodes);
    }
  }

  return elem;
}

function existsOne(test, elems){
  for(var i = 0, l = elems.length; i < l; i++){
    if(
      isTag(elems[i]) && (
        test(elems[i]) || (
          elems[i].childNodes.length > 0 &&
          existsOne(test, elems[i].childNodes)
        )
      )
    ){
      return true;
    }
  }

  return false;
}

function findAll(test, elems){
  var result = [];
  for(var i = 0, j = elems.length; i < j; i++){
    if(!isTag(elems[i])) continue;
    if(test(elems[i])) result.push(elems[i]);

    if(elems[i].childNodes.length > 0){
      result = result.concat(findAll(test, elems[i].childNodes));
    }
  }
  return result;
}
