import BaseFuncs from 'boolbase';
import nthCheck from 'nth-check';
import cssWhat from 'css-what';
import domutils from 'domutils';

var universal = 50;
var tag = 30;
var attribute = 1;
var pseudo = 0;
var descendant = -1;
var child = -1;
var parent = -1;
var sibling = -1;
var adjacent = -1;
var procedure = {
	universal: universal,
	tag: tag,
	attribute: attribute,
	pseudo: pseudo,
	descendant: descendant,
	child: child,
	parent: parent,
	sibling: sibling,
	adjacent: adjacent
};

var procedure$1 = /*#__PURE__*/Object.freeze({
  universal: universal,
  tag: tag,
  attribute: attribute,
  pseudo: pseudo,
  descendant: descendant,
  child: child,
  parent: parent,
  sibling: sibling,
  adjacent: adjacent,
  default: procedure
});

var procedure$2 = ( procedure$1 && procedure ) || procedure$1;

var sort = sortByProcedure;





var attributes = {
	__proto__: null,
	exists: 10,
	equals: 8,
	not: 7,
	start: 6,
	end: 6,
	any: 5,
	hyphen: 4,
	element: 4
};

function sortByProcedure(arr){
	var procs = arr.map(getProcedure);
	for(var i = 1; i < arr.length; i++){
		var procNew = procs[i];

		if(procNew < 0) continue;

		for(var j = i - 1; j >= 0 && procNew < procs[j]; j--){
			var token = arr[j + 1];
			arr[j + 1] = arr[j];
			arr[j] = token;
			procs[j + 1] = procs[j];
			procs[j] = procNew;
		}
	}
}

function getProcedure(token){
	var proc = procedure$2[token.type];

	if(proc === procedure$2.attribute){
		proc = attributes[token.action];

		if(proc === attributes.equals && token.name === "id"){
			
			proc = 9;
		}

		if(token.ignoreCase){
			
			
			proc >>= 1;
		}
	} else if(proc === procedure$2.pseudo){
		if(!token.data){
			proc = 3;
		} else if(token.name === "has" || token.name === "contains"){
			proc = 0; 
		} else if(token.name === "matches" || token.name === "not"){
			proc = 0;
			for(var i = 0; i < token.data.length; i++){
				
				if(token.data[i].length !== 1) continue;
				var cur = getProcedure(token.data[i][0]);
				
				if(cur === 0){
					proc = 0;
					break;
				}
				if(cur > proc) proc = cur;
			}
			if(token.data.length > 1 && proc > 0) proc -= 1;
		} else {
			proc = 1;
		}
	}
	return proc;
}

var falseFunc = BaseFuncs.falseFunc;


var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;

function factory(adapter){
	
	var attributeRules = {
		__proto__: null,
		equals: function(next, data){
			var name  = data.name,
				value = data.value;

			if(data.ignoreCase){
				value = value.toLowerCase();

				return function equalsIC(elem){
					var attr = adapter.getAttributeValue(elem, name);
					return attr != null && attr.toLowerCase() === value && next(elem);
				};
			}

			return function equals(elem){
				return adapter.getAttributeValue(elem, name) === value && next(elem);
			};
		},
		hyphen: function(next, data){
			var name  = data.name,
				value = data.value,
				len = value.length;

			if(data.ignoreCase){
				value = value.toLowerCase();

				return function hyphenIC(elem){
					var attr = adapter.getAttributeValue(elem, name);
					return attr != null &&
							(attr.length === len || attr.charAt(len) === "-") &&
							attr.substr(0, len).toLowerCase() === value &&
							next(elem);
				};
			}

			return function hyphen(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null &&
						attr.substr(0, len) === value &&
						(attr.length === len || attr.charAt(len) === "-") &&
						next(elem);
			};
		},
		element: function(next, data){
			var name = data.name,
				value = data.value;
			if (data.name === 'class') {
				let value = data.value;
				if (/\s/.test(value)) return function() { return false }
				return function clazz(elem) {
					let classes = elem.classes;
					return classes && classes.has(value) && next(elem)
				}
			} else {
				if(/\s/.test(value)){
					return falseFunc;
				}

				value = value.replace(reChars, "\\$&");

				var pattern = "(?:^|\\s)" + value + "(?:$|\\s)",
					flags = data.ignoreCase ? "i" : "",
					regex = new RegExp(pattern, flags);

				return function element(elem){
					var attr = adapter.getAttributeValue(elem, name);
					return attr != null && regex.test(attr) && next(elem);
				};
			}
		},
		exists: function(next, data){
			var name = data.name;
			return function exists(elem){
				return adapter.hasAttrib(elem, name) && next(elem);
			};
		},
		start: function(next, data){
			var name  = data.name,
				value = data.value,
				len = value.length;

			if(len === 0){
				return falseFunc;
			}

			if(data.ignoreCase){
				value = value.toLowerCase();

				return function startIC(elem){
					var attr = adapter.getAttributeValue(elem, name);
					return attr != null && attr.substr(0, len).toLowerCase() === value && next(elem);
				};
			}

			return function start(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.substr(0, len) === value && next(elem);
			};
		},
		end: function(next, data){
			var name  = data.name,
				value = data.value,
				len   = -value.length;

			if(len === 0){
				return falseFunc;
			}

			if(data.ignoreCase){
				value = value.toLowerCase();

				return function endIC(elem){
					var attr = adapter.getAttributeValue(elem, name);
					return attr != null && attr.substr(len).toLowerCase() === value && next(elem);
				};
			}

			return function end(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.substr(len) === value && next(elem);
			};
		},
		any: function(next, data){
			var name  = data.name,
				value = data.value;

			if(value === ""){
				return falseFunc;
			}

			if(data.ignoreCase){
				var regex = new RegExp(value.replace(reChars, "\\$&"), "i");

				return function anyIC(elem){
					var attr = adapter.getAttributeValue(elem, name);
					return attr != null && regex.test(attr) && next(elem);
				};
			}

			return function any(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.indexOf(value) >= 0 && next(elem);
			};
		},
		not: function(next, data){
			var name  = data.name,
				value = data.value;

			if(value === ""){
				return function notEmpty(elem){
					return !!adapter.getAttributeValue(elem, name) && next(elem);
				};
			} else if(data.ignoreCase){
				value = value.toLowerCase();

				return function notIC(elem){
					var attr = adapter.getAttributeValue(elem, name);
					return attr != null && attr.toLowerCase() !== value && next(elem);
				};
			}

			return function not(elem){
				return adapter.getAttributeValue(elem, name) !== value && next(elem);
			};
		}
	};

	return {
		compile: function(next, data, options){
			if(options && options.strict && (
				data.ignoreCase || data.action === "not"
			)) throw new Error("Unsupported attribute selector");
			return attributeRules[data.action](next, data);
		},
		rules: attributeRules
	};
}

var attributes$1 = factory;

function generalFactory(adapter, Pseudos){
	
	return {
		__proto__: null,

		attribute: attributes$1(adapter).compile,
		pseudo: Pseudos.compile,

		
		tag: function(next, data){
			var name = data.name;
			return function tag(elem){
				return adapter.getNameWithoutNS(elem) === name && next(elem);
			}
		},

		
		descendant: function(next){
			return function descendant(elem){

				var found = false;

				while(!found && (elem = adapter.getParent(elem))){
					found = next(elem);
				}

				return found;
			};
		},
		_flexibleDescendant: function(next){
			
			return function descendant(elem){

				var found = next(elem);

				while(!found && (elem = adapter.getParent(elem))){
					found = next(elem);
				}

				return found;
			};
		},
		parent: function(next, data, options){
			if(options && options.strict) throw new Error("Parent selector isn't part of CSS3");

			return function parent(elem){
				return adapter.getChildren(elem).some(test);
			};

			function test(elem){
				return adapter.isTag(elem) && next(elem);
			}
		},
		child: function(next){
			return function child(elem){
				var parent = adapter.getParent(elem);
				return !!parent && next(parent);
			};
		},
		sibling: function(next){
			return function sibling(elem){
				var siblings = adapter.getSiblings(elem);

				for(var i = 0; i < siblings.length; i++){
					if(adapter.isTag(siblings[i])){
						if(siblings[i] === elem) break;
						if(next(siblings[i])) return true;
					}
				}

				return false;
			};
		},
		adjacent: function(next){
			return function adjacent(elem){
				var siblings = adapter.getSiblings(elem),
					lastElement;

				for(var i = 0; i < siblings.length; i++){
					if(adapter.isTag(siblings[i])){
						if(siblings[i] === elem) break;
						lastElement = siblings[i];
					}
				}

				return !!lastElement && next(lastElement);
			};
		},
		universal: function(next){
			return next;
		}
	};
}

var general = generalFactory;

var trueFunc          = BaseFuncs.trueFunc,
	falseFunc$1         = BaseFuncs.falseFunc;

function filtersFactory(adapter){
	var attributes  = attributes$1(adapter),
		checkAttrib = attributes.rules.equals;

	
	function equals(a, b){
		if(typeof adapter.equals === "function") return adapter.equals(a, b);

		return a === b;
	}

	function getAttribFunc(name, value){
		var data = {name: name, value: value};
		return function attribFunc(next){
			return checkAttrib(next, data);
		};
	}

	function getChildFunc(next){
		return function(elem){
			return !!adapter.getParent(elem) && next(elem);
		};
	}

	var filters = {
		contains: function(next, text){
			return function contains(elem){
				return next(elem) && adapter.getText(elem).indexOf(text) >= 0;
			};
		},
		icontains: function(next, text){
			var itext = text.toLowerCase();
			return function icontains(elem){
				return next(elem) &&
					adapter.getText(elem).toLowerCase().indexOf(itext) >= 0;
			};
		},

		
		"nth-child": function(next, rule){
			var func = nthCheck(rule);

			if(func === falseFunc$1) return func;
			if(func === trueFunc)  return getChildFunc(next);

			return function nthChild(elem){
				var siblings = adapter.getSiblings(elem);

				for(var i = 0, pos = 0; i < siblings.length; i++){
					if(adapter.isTag(siblings[i])){
						if(siblings[i] === elem) break;
						else pos++;
					}
				}

				return func(pos) && next(elem);
			};
		},
		"nth-last-child": function(next, rule){
			var func = nthCheck(rule);

			if(func === falseFunc$1) return func;
			if(func === trueFunc)  return getChildFunc(next);

			return function nthLastChild(elem){
				var siblings = adapter.getSiblings(elem);

				for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
					if(adapter.isTag(siblings[i])){
						if(siblings[i] === elem) break;
						else pos++;
					}
				}

				return func(pos) && next(elem);
			};
		},
		"nth-of-type": function(next, rule){
			var func = nthCheck(rule);

			if(func === falseFunc$1) return func;
			if(func === trueFunc)  return getChildFunc(next);

			return function nthOfType(elem){
				var siblings = adapter.getSiblings(elem);

				for(var pos = 0, i = 0; i < siblings.length; i++){
					if(adapter.isTag(siblings[i])){
						if(siblings[i] === elem) break;
						if(adapter.getName(siblings[i]) === adapter.getName(elem)) pos++;
					}
				}

				return func(pos) && next(elem);
			};
		},
		"nth-last-of-type": function(next, rule){
			var func = nthCheck(rule);

			if(func === falseFunc$1) return func;
			if(func === trueFunc)  return getChildFunc(next);

			return function nthLastOfType(elem){
				var siblings = adapter.getSiblings(elem);

				for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
					if(adapter.isTag(siblings[i])){
						if(siblings[i] === elem) break;
						if(adapter.getName(siblings[i]) === adapter.getName(elem)) pos++;
					}
				}

				return func(pos) && next(elem);
			};
		},

		
		root: function(next){
			return function(elem){
				return !adapter.getParent(elem) && next(elem);
			};
		},

		scope: function(next, rule, options, context){
			if(!context || context.length === 0){
				
				return filters.root(next);
			}

			if(context.length === 1){
				
				return function(elem){
					return equals(context[0], elem) && next(elem);
				};
			}

			return function(elem){
				return context.indexOf(elem) >= 0 && next(elem);
			};
		},

		
		checkbox: getAttribFunc("type", "checkbox"),
		file: getAttribFunc("type", "file"),
		password: getAttribFunc("type", "password"),
		radio: getAttribFunc("type", "radio"),
		reset: getAttribFunc("type", "reset"),
		image: getAttribFunc("type", "image"),
		submit: getAttribFunc("type", "submit")
	};
	return filters;
}

function pseudosFactory(adapter){
	
	function getFirstElement(elems){
		for(var i = 0; elems && i < elems.length; i++){
			if(adapter.isTag(elems[i])) return elems[i];
		}
	}

	
	var pseudos = {
		empty: function(elem){
			return !adapter.getChildren(elem).some(function(elem){
				return adapter.isTag(elem) || elem.type === "text";
			});
		},

		"first-child": function(elem){
			return getFirstElement(adapter.getSiblings(elem)) === elem;
		},
		"last-child": function(elem){
			var siblings = adapter.getSiblings(elem);

			for(var i = siblings.length - 1; i >= 0; i--){
				if(siblings[i] === elem) return true;
				if(adapter.isTag(siblings[i])) break;
			}

			return false;
		},
		"first-of-type": function(elem){
			var siblings = adapter.getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) return true;
					if(adapter.getName(siblings[i]) === adapter.getName(elem)) break;
				}
			}

			return false;
		},
		"last-of-type": function(elem){
			var siblings = adapter.getSiblings(elem);

			for(var i = siblings.length - 1; i >= 0; i--){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) return true;
					if(adapter.getName(siblings[i]) === adapter.getName(elem)) break;
				}
			}

			return false;
		},
		"only-of-type": function(elem){
			var siblings = adapter.getSiblings(elem);

			for(var i = 0, j = siblings.length; i < j; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) continue;
					if(adapter.getName(siblings[i]) === adapter.getName(elem)) return false;
				}
			}

			return true;
		},
		"only-child": function(elem){
			var siblings = adapter.getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i]) && siblings[i] !== elem) return false;
			}

			return true;
		},

		
		link: function(elem){
			return adapter.hasAttrib(elem, "href");
		},
		visited: falseFunc$1, 
		

		
		

		
		selected: function(elem){
			if(adapter.hasAttrib(elem, "selected")) return true;
			else if(adapter.getName(elem) !== "option") return false;

			
			var parent = adapter.getParent(elem);

			if(
				!parent ||
				adapter.getName(parent) !== "select" ||
				adapter.hasAttrib(parent, "multiple")
			) return false;

			var siblings = adapter.getChildren(parent),
				sawElem  = false;

			for(var i = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem){
						sawElem = true;
					} else if(!sawElem){
						return false;
					} else if(adapter.hasAttrib(siblings[i], "selected")){
						return false;
					}
				}
			}

			return sawElem;
		},
		
		
		
		
		
		
		disabled: function(elem){
			return adapter.hasAttrib(elem, "disabled");
		},
		enabled: function(elem){
			return !adapter.hasAttrib(elem, "disabled");
		},
		
		checked: function(elem){
			return adapter.hasAttrib(elem, "checked") || pseudos.selected(elem);
		},
		
		required: function(elem){
			return adapter.hasAttrib(elem, "required");
		},
		
		optional: function(elem){
			return !adapter.hasAttrib(elem, "required");
		},

		

		
		parent: function(elem){
			return !pseudos.empty(elem);
		},
		
		header: function(elem){
			var name = adapter.getName(elem);
			return name === "h1" ||
					name === "h2" ||
					name === "h3" ||
					name === "h4" ||
					name === "h5" ||
					name === "h6";
		},

		
		button: function(elem){
			var name = adapter.getName(elem);
			return name === "button" ||
					name === "input" &&
					adapter.getAttributeValue(elem, "type") === "button";
		},
		
		input: function(elem){
			var name = adapter.getName(elem);
			return name === "input" ||
					name === "textarea" ||
					name === "select" ||
					name === "button";
		},
		
		text: function(elem){
			var attr;
			return adapter.getName(elem) === "input" && (
				!(attr = adapter.getAttributeValue(elem, "type")) ||
				attr.toLowerCase() === "text"
			);
		}
	};

	return pseudos;
}

function verifyArgs(func, name, subselect){
	if(subselect === null){
		if(func.length > 1 && name !== "scope"){
			throw new Error("pseudo-selector :" + name + " requires an argument");
		}
	} else {
		if(func.length === 1){
			throw new Error("pseudo-selector :" + name + " doesn't have any arguments");
		}
	}
}


var re_CSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;

function factory$1(adapter){
	var pseudos = pseudosFactory(adapter);
	var filters = filtersFactory(adapter);

	return {
		compile: function(next, data, options, context){
			var name = data.name,
				subselect = data.data;

			if(options && options.strict && !re_CSS3.test(name)){
				throw new Error(":" + name + " isn't part of CSS3");
			}

			if(typeof filters[name] === "function"){
				verifyArgs(filters[name], name,  subselect);
				return filters[name](next, subselect, options, context);
			} else if(typeof pseudos[name] === "function"){
				var func = pseudos[name];
				verifyArgs(func, name, subselect);

				if(next === trueFunc) return func;

				return function pseudoArgs(elem){
					return func(elem, subselect) && next(elem);
				};
			} else {
				throw new Error("unmatched pseudo-class :" + name);
			}
		},
		filters: filters,
		pseudos: pseudos
	};
}

var pseudos = factory$1;

var compile = compileFactory;

var trueFunc$1       = BaseFuncs.trueFunc,
	falseFunc$2      = BaseFuncs.falseFunc;

function compileFactory(adapter){
	var Pseudos     = pseudos(adapter),
		filters     = Pseudos.filters,
		Rules 			= general(adapter, Pseudos);

	function compile(selector, options, context){
		var next = compileUnsafe(selector, options, context);
		return wrap(next);
	}

	function wrap(next){
		return function base(elem){
			return adapter.isTag(elem) && next(elem);
		};
	}

	function compileUnsafe(selector, options, context){
		var token = cssWhat(selector, options);
		return compileToken(token, options, context);
	}

	function includesScopePseudo(t){
		return t.type === "pseudo" && (
			t.name === "scope" || (
				Array.isArray(t.data) &&
				t.data.some(function(data){
					return data.some(includesScopePseudo);
				})
			)
		);
	}

	var DESCENDANT_TOKEN = {type: "descendant"},
		FLEXIBLE_DESCENDANT_TOKEN = {type: "_flexibleDescendant"},
		SCOPE_TOKEN = {type: "pseudo", name: "scope"},
		PLACEHOLDER_ELEMENT = {};

	
	
	function absolutize(token, context){
		
		var hasContext = !!context && !!context.length && context.every(function(e){
			return e === PLACEHOLDER_ELEMENT || !!adapter.getParent(e);
		});


		token.forEach(function(t){
			if(t.length > 0 && isTraversal(t[0]) && t[0].type !== "descendant"); else if(hasContext && !includesScopePseudo(t)){
				t.unshift(DESCENDANT_TOKEN);
			} else {
				return;
			}

			t.unshift(SCOPE_TOKEN);
		});
	}

	function compileToken(token, options, context){
		token = token.filter(function(t){ return t.length > 0; });

		token.forEach(sort);

		var isArrayContext = Array.isArray(context);

		context = (options && options.context) || context;

		if(context && !isArrayContext) context = [context];

		absolutize(token, context);

		var shouldTestNextSiblings = false;

		var query = token
			.map(function(rules){
				if(rules[0] && rules[1] && rules[0].name === "scope"){
					var ruleType = rules[1].type;
					if(isArrayContext && ruleType === "descendant") rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
					else if(ruleType === "adjacent" || ruleType === "sibling") shouldTestNextSiblings = true;
				}
				return compileRules(rules, options, context);
			})
			.reduce(reduceRules, falseFunc$2);

		query.shouldTestNextSiblings = shouldTestNextSiblings;

		return query;
	}

	function isTraversal(t){
		return procedure$2[t.type] < 0;
	}

	function compileRules(rules, options, context){
		return rules.reduce(function(func, rule){
			if(func === falseFunc$2) return func;
			return Rules[rule.type](func, rule, options, context);
		}, options && options.rootFunc || trueFunc$1);
	}

	function reduceRules(a, b){
		if(b === falseFunc$2 || a === trueFunc$1){
			return a;
		}
		if(a === falseFunc$2 || b === trueFunc$1){
			return b;
		}

		return function combine(elem){
			return a(elem) || b(elem);
		};
	}

	function containsTraversal(t){
		return t.some(isTraversal);
	}

	
	
	
	filters.not = function(next, token, options, context){
		var opts = {
			xmlMode: !!(options && options.xmlMode),
			strict: !!(options && options.strict)
		};

		if(opts.strict){
			if(token.length > 1 || token.some(containsTraversal)){
				throw new Error("complex selectors in :not aren't allowed in strict mode");
			}
		}

		var func = compileToken(token, opts, context);

		if(func === falseFunc$2) return next;
		if(func === trueFunc$1)  return falseFunc$2;

		return function(elem){
			return !func(elem) && next(elem);
		};
	};

	filters.has = function(next, token, options){
		var opts = {
			xmlMode: !!(options && options.xmlMode),
			strict: !!(options && options.strict)
		};

		
		var context = token.some(containsTraversal) ? [PLACEHOLDER_ELEMENT] : null;

		var func = compileToken(token, opts, context);

		if(func === falseFunc$2) return falseFunc$2;
		if(func === trueFunc$1){
			return function(elem){
				return adapter.getChildren(elem).some(adapter.isTag) && next(elem);
			};
		}

		func = wrap(func);

		if(context){
			return function has(elem){
				return next(elem) && (
					(context[0] = elem), adapter.existsOne(func, adapter.getChildren(elem))
				);
			};
		}

		return function has(elem){
			return next(elem) && adapter.existsOne(func, adapter.getChildren(elem));
		};
	};

	filters.matches = function(next, token, options, context){
		var opts = {
			xmlMode: !!(options && options.xmlMode),
			strict: !!(options && options.strict),
			rootFunc: next
		};

		return compileToken(token, opts, context);
	};

	compile.compileToken = compileToken;
	compile.compileUnsafe = compileUnsafe;
	compile.Pseudos = Pseudos;

	return compile;
}

var cssSelect = CSSselect;

var falseFunc$3      = BaseFuncs.falseFunc,
	defaultCompile = compile(domutils);

function adapterCompile(adapter){
	if(!adapter.__compile__){
		adapter.__compile__ = compile(adapter);
	}
	return adapter.__compile__
}

function getSelectorFunc(searchFunc){
	return function select(query, elems, options){
		options = options || {};
		options.adapter = options.adapter || domutils;
		var compile$$1 = adapterCompile(options.adapter);

		if(typeof query !== "function") query = compile$$1.compileUnsafe(query, options, elems);
		if(query.shouldTestNextSiblings) elems = appendNextSiblings((options && options.context) || elems, options.adapter);
		if(!Array.isArray(elems)) elems = options.adapter.getChildren(elems);
		else elems = options.adapter.removeSubsets(elems);
		return searchFunc(query, elems, options);
	};
}

function getNextSiblings(elem, adapter){
	var siblings = adapter.getSiblings(elem);
	if(!Array.isArray(siblings)) return [];
	siblings = siblings.slice(0);
	while(siblings.shift() !== elem);
	return siblings;
}

function appendNextSiblings(elems, adapter){
	
	if(!Array.isArray(elems)) elems = [elems];
	var newElems = elems.slice(0);

	for(var i = 0, len = elems.length; i < len; i++){
		var nextSiblings = getNextSiblings(newElems[i], adapter);
		newElems.push.apply(newElems, nextSiblings);
	}
	return newElems;
}

var selectAll = getSelectorFunc(function selectAll(query, elems, options){
	return (query === falseFunc$3 || !elems || elems.length === 0) ? [] : options.adapter.findAll(query, elems);
});

var selectOne = getSelectorFunc(function selectOne(query, elems, options){
	return (query === falseFunc$3 || !elems || elems.length === 0) ? null : options.adapter.findOne(query, elems);
});

function is(elem, query, options){
	options = options || {};
	options.adapter = options.adapter || domutils;
	var compile$$1 = adapterCompile(options.adapter);
	return (typeof query === "function" ? query : compile$$1(query, options))(elem);
}


function CSSselect(query, elems, options){
	return selectAll(query, elems, options);
}

CSSselect.compile = defaultCompile;
CSSselect.filters = defaultCompile.Pseudos.filters;
CSSselect.pseudos = defaultCompile.Pseudos.pseudos;

CSSselect.selectAll = selectAll;
CSSselect.selectOne = selectOne;

CSSselect.is = is;


CSSselect.parse = defaultCompile;
CSSselect.iterate = selectAll;


CSSselect._compileUnsafe = defaultCompile.compileUnsafe;
CSSselect._compileToken = defaultCompile.compileToken;

export default cssSelect;

//# sourceMappingURL=./css-select.js.map