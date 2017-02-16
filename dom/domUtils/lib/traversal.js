var getChildren = exports.getChildren = function(elem){
  return elem.childNodes;
};

var getParent = exports.getParent = function(elem){
  return elem.parent;
};

exports.getSiblings = function(elem){
  var parent = getParent(elem);
  return parent ? getChildren(parent) : [elem];
};

exports.getAttributeValue = function(elem, name){
  return elem.getAttribute(name);
};

exports.hasAttrib = function(elem, name){
  return elem.hasAttribute(name);
};

exports.getName = function(elem){
  return elem.name
};
