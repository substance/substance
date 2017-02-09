var ElementType = require("domelementtype"),
    getOuterHTML = require("dom-serializer"),
    isTag = ElementType.isTag;

module.exports = {
  getInnerHTML: getInnerHTML,
  getOuterHTML: getOuterHTML,
  getText: getText
};

function getInnerHTML(elem, opts){
  return elem.childNodes ? elem.childNodes.map(function(elem){
    return getOuterHTML(elem, opts);
  }).join("") : "";
}

function getText(elem){
  if(Array.isArray(elem)) return elem.map(getText).join("");
  if(isTag(elem) || elem.type === ElementType.CDATA) return getText(elem.childNodes);
  if(elem.type === ElementType.Text) return elem.data;
  return "";
}
