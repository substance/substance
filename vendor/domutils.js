import require$$0 from 'domelementtype';
import entities from 'entities';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var ElementType$1 = require$$0;
var entities$1 = entities;

const booleanAttributes = {
  __proto__: null,
  allowfullscreen: true,
  async: true,
  autofocus: true,
  autoplay: true,
  checked: true,
  controls: true,
  default: true,
  defer: true,
  disabled: true,
  hidden: true,
  ismap: true,
  loop: true,
  multiple: true,
  muted: true,
  open: true,
  readonly: true,
  required: true,
  reversed: true,
  scoped: true,
  seamless: true,
  selected: true,
  typemustmatch: true
};

const unencodedElements = {
  __proto__: null,
  style: true,
  script: true,
  xmp: true,
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  noscript: true
};

const singleTag = {
  __proto__: null,
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};

function formatAttribs(el, opts) {
  let output = [];
  const attributes = el.attributes;
  
  attributes.forEach((value, key) => {
    if (!value && booleanAttributes[key]) {
      output.push(key);
    } else {
      output.push(key + '="' + (opts.decodeEntities ? entities$1.encodeXML(value) : value) + '"');
    }
  });
  return output.join(' ')
}

function render(dom, opts) {
  if (!Array.isArray(dom)) dom = [dom];
  opts = opts || {};

  let output = [];

  for(var i = 0; i < dom.length; i++){
    let elem = dom[i];

    if (elem.type === 'root') {
      output.push(render(elem.childNodes, opts));
    } else if (ElementType$1.isTag(elem)) {
      output.push(renderTag(elem, opts));
    } else if (elem.type === ElementType$1.Directive) {
      output.push(renderDirective(elem));
    } else if (elem.type === ElementType$1.Comment) {
      output.push(renderComment(elem));
    } else if (elem.type === ElementType$1.CDATA) {
      output.push(renderCdata(elem));
    } else {
      output.push(renderText(elem, opts));
    }
  }

  return output.join('')
}

function renderTag(elem, opts) {
  
  if (elem.name === "svg") opts = {decodeEntities: opts.decodeEntities, xmlMode: true};

  let tag = '<' + elem.name;
  let attribs = formatAttribs(elem, opts);

  if (attribs) {
    tag += ' ' + attribs;
  }

  if (
    opts.xmlMode
    && (!elem.childNodes || elem.childNodes.length === 0)
  ) {
    tag += '/>';
  } else {
    tag += '>';
    if (elem.childNodes) {
      tag += render(elem.childNodes, opts);
    }

    if (!singleTag[elem.name] || opts.xmlMode) {
      tag += '</' + elem.name + '>';
    }
  }

  return tag
}

function renderDirective(elem) {
  return '<' + elem.data + '>'
}

function renderText(elem, opts) {
  var data = elem.data || '';
  
  if (opts.decodeEntities && !(elem.parent && elem.parent.name in unencodedElements)) {
    data = entities$1.encodeXML(data);
  }
  return data
}

function renderCdata(elem) {
  return '<![CDATA[' + elem.childNodes[0].data + ']]>'
}

function renderComment(elem) {
  return '<!--' + elem.data + '-->'
}

var serialize$1 = render;

let ElementType = require$$0;
let serialize = serialize$1;
var stringify = {
	getInnerHTML: getInnerHTML,
	getOuterHTML: serialize,
	getText: getText
};

function getInnerHTML(elem, opts){
	return elem.childNodes ? elem.childNodes.map(function(elem){
		return serialize(elem, opts);
	}).join("") : "";
}

function getText(elem){
	if(Array.isArray(elem)) return elem.map(getText).join("");
	switch(elem.type) {
		case ElementType.Tag:
		case ElementType.Script:
		case ElementType.Style:
			return getText(elem.childNodes)
		case ElementType.Text:
		case ElementType.Comment:
		case ElementType.CDATA:
			return elem.data
		default:
			return ""
	}
}

var traversal = createCommonjsModule(function (module, exports) {
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

exports.getNameWithoutNS = function(elem){
  return elem.nameWithoutNS
};
});

var manipulation = createCommonjsModule(function (module, exports) {
function removeElement(elem){
	if(elem.prev) elem.prev.next = elem.next;
	if(elem.next) elem.next.prev = elem.prev;
	if(elem.parent){
		var childs = elem.parent.childNodes;
		let pos = childs.lastIndexOf(elem);
		if (pos < 0) throw new Error('Invalid state')
		childs.splice(pos, 1);
		elem.parent = null;
	}
}

function replaceElement(elem, replacement){
	if (replacement.parent) exports.removeElement(replacement);
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
		let pos = childs.lastIndexOf(elem);
		if (pos < 0) throw new Error('Invalid state')
		childs[pos] = replacement;
	}
}

function appendChild(elem, child){
	if (child.parent) removeElement(child);
	child.parent = elem;

	if(elem.childNodes.push(child) !== 1){
		var sibling = elem.childNodes[elem.childNodes.length - 2];
		sibling.next = child;
		child.prev = sibling;
		child.next = null;
	}
}

function append(elem, next){
	if (next.parent) removeElement(next);
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
			let pos = childs.lastIndexOf(currNext);
			if (pos < 0) throw new Error('Invalid state')
			childs.splice(pos, 0, next);
		}
	} else if(parent){
		parent.childNodes.push(next);
	}
}

function prepend(elem, prev){
	if (prev.parent) removeElement(prev);
	var parent = elem.parent;
	if(parent){
		var childs = parent.childNodes;
		let pos = childs.lastIndexOf(elem);
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

exports.removeElement = removeElement;
exports.replaceElement = replaceElement;
exports.appendChild = appendChild;
exports.append = append;
exports.prepend = prepend;
});

var isTag$1 = require$$0.isTag;

var querying = {
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
		const child = elems[i];
		if(!isTag$1(child)){
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
			isTag$1(elems[i]) && (
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
		if(!isTag$1(elems[i])) continue;
		if(test(elems[i])) result.push(elems[i]);

		if(elems[i].childNodes.length > 0){
			result = result.concat(findAll(test, elems[i].childNodes));
		}
	}
	return result;
}

var legacy = createCommonjsModule(function (module, exports) {
var ElementType = require$$0;
var isTag = exports.isTag = ElementType.isTag;

exports.testElement = function(options, element){
	for(var key in options){
		if(!options.hasOwnProperty(key));
		else if(key === "tag_name"){
			if(!isTag(element) || !options.tag_name(element.name)){
				return false;
			}
		} else if(key === "tag_type"){
			if(!options.tag_type(element.type)) return false;
		} else if(key === "tag_contains"){
			if(isTag(element) || !options.tag_contains(element.data)){
				return false;
			}
		} else if(!element.attributes || !options[key](element.getAttribute(key))) {
			return false;
		}
	}
	return true;
};

var Checks = {
	tag_name: function(name){
		if(typeof name === "function"){
			return function(elem){ return isTag(elem) && name(elem.name); };
		} else if(name === "*"){
			return isTag;
		} else {
			return function(elem){ return isTag(elem) && elem.name === name; };
		}
	},
	tag_type: function(type){
		if(typeof type === "function"){
			return function(elem){ return type(elem.type); };
		} else {
			return function(elem){ return elem.type === type; };
		}
	},
	tag_contains: function(data){
		if(typeof data === "function"){
			return function(elem){ return !isTag(elem) && data(elem.data); };
		} else {
			return function(elem){ return !isTag(elem) && elem.data === data; };
		}
	}
};

function getAttribCheck(attrib, value){
	if(typeof value === "function"){
		return function(elem){ return value(elem.getAttribute(attrib)); };
	} else {
		return function(elem){ return elem.getAttribute(attrib) === value; };
	}
}

function combineFuncs(a, b){
	return function(elem){
		return a(elem) || b(elem);
	};
}

exports.getElements = function(options, element, recurse, limit){
	var funcs = Object.keys(options).map(function(key){
		var value = options[key];
		return key in Checks ? Checks[key](value) : getAttribCheck(key, value);
	});

	return funcs.length === 0 ? [] : this.filter(
		funcs.reduce(combineFuncs),
		element, recurse, limit
	);
};

exports.getElementById = function(id, element, recurse){
	if(!Array.isArray(element)) element = [element];
	return this.findOne(getAttribCheck("id", id), element, recurse !== false);
};

exports.getElementsByTagName = function(name, element, recurse, limit){
	return this.filter(Checks.tag_name(name), element, recurse, limit);
};

exports.getElementsByTagType = function(type, element, recurse, limit){
	return this.filter(Checks.tag_type(type), element, recurse, limit);
};
});

var helpers = createCommonjsModule(function (module, exports) {


exports.removeSubsets = function(nodes) {
	var idx = nodes.length, node, ancestor, replace;

	
	
	while (--idx > -1) {
		node = ancestor = nodes[idx];

		
		nodes[idx] = null;
		replace = true;

		while (ancestor) {
			if (nodes.indexOf(ancestor) > -1) {
				replace = false;
				nodes.splice(idx, 1);
				break;
			}
			ancestor = ancestor.parent;
		}

		
		if (replace) {
			nodes[idx] = node;
		}
	}

	return nodes;
};


var POSITION = {
	DISCONNECTED: 1,
	PRECEDING: 2,
	FOLLOWING: 4,
	CONTAINS: 8,
	CONTAINED_BY: 16
};























var comparePos = exports.compareDocumentPosition = function(nodeA, nodeB) {
	var aParents = [];
	var bParents = [];
	var current, sharedParent, siblings, aSibling, bSibling, idx;

	if (nodeA === nodeB) {
		return 0;
	}

	current = nodeA;
	while (current) {
		aParents.unshift(current);
		current = current.parent;
	}
	current = nodeB;
	while (current) {
		bParents.unshift(current);
		current = current.parent;
	}

	idx = 0;
	while (aParents[idx] === bParents[idx]) {
		idx++;
	}

	if (idx === 0) {
		return POSITION.DISCONNECTED;
	}

	sharedParent = aParents[idx - 1];
	siblings = sharedParent.childNodes;
	aSibling = aParents[idx];
	bSibling = bParents[idx];

	if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
		if (sharedParent === nodeB) {
			return POSITION.FOLLOWING | POSITION.CONTAINED_BY;
		}
		return POSITION.FOLLOWING;
	} else {
		if (sharedParent === nodeA) {
			return POSITION.PRECEDING | POSITION.CONTAINS;
		}
		return POSITION.PRECEDING;
	}
};








exports.uniqueSort = function(nodes) {
	var idx = nodes.length, node, position;

	nodes = nodes.slice();

	while (--idx > -1) {
		node = nodes[idx];
		position = nodes.indexOf(node);
		if (position > -1 && position < idx) {
			nodes.splice(idx, 1);
		}
	}
	nodes.sort(function(a, b) {
		var relative = comparePos(a, b);
		if (relative & POSITION.PRECEDING) {
			return -1;
		} else if (relative & POSITION.FOLLOWING) {
			return 1;
		}
		return 0;
	});

	return nodes;
};
});

var index = createCommonjsModule(function (module) {
var DomUtils = module.exports;

[
	stringify,
	traversal,
	manipulation,
	querying,
	legacy,
	helpers
].forEach(function(ext){
	Object.keys(ext).forEach(function(key){
		DomUtils[key] = ext[key].bind(DomUtils);
	});
});
});

export default index;
