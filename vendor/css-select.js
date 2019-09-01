import domutils from '../dom/domutils';
import boolbase from 'boolbase';
import cssWhat from 'css-what';
import nthCheck from 'nth-check';

var procedure = new Map([
  ["universal", 50],
  ["tag", 30],
  ["attribute", 1],
  ["pseudo", 0],
  ["descendant", -1],
  ["child", -1],
  ["parent", -1],
  ["sibling", -1],
  ["adjacent", -1]
]);

var sort = sortByProcedure;

/*
	sort the parts of the passed selector,
	as there is potential for optimization
	(some types of selectors are faster than others)
*/



let attributes = new Map([
	['exists', 10],
	['equals', 8],
	['not', 7],
	['start', 6],
	['end', 6],
	['any', 5],
	['hyphen', 4],
	['element', 4]
]);

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
	var proc = procedure.get(token.type);

	if(proc === procedure.get('attribute')){
		proc = attributes.get(token.action);

		if(proc === attributes.get('equals') && token.name === "id"){
			//prefer ID selectors (eg. #ID)
			proc = 9;
		}

		if(token.ignoreCase){
			//ignoreCase adds some overhead, prefer "normal" token
			//this is a binary operation, to ensure it's still an int
			proc >>= 1;
		}
	} else if(proc === procedure.get('pseudo')){
		if(!token.data){
			proc = 3;
		} else if(token.name === "has" || token.name === "contains"){
			proc = 0; //expensive in any case
		} else if(token.name === "matches" || token.name === "not"){
			proc = 0;
			for(var i = 0; i < token.data.length; i++){
				//TODO better handling of complex selectors
				if(token.data[i].length !== 1) continue;
				var cur = getProcedure(token.data[i][0]);
				//avoid executing :has or :contains
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

var falseFunc = boolbase.falseFunc;

//https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;

function factory(adapter){

	function _equals(next, data){
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
	}

	function _hyphen(next, data){
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

		return function (elem){
			var attr = adapter.getAttributeValue(elem, name);
			return attr != null &&
					attr.substr(0, len) === value &&
					(attr.length === len || attr.charAt(len) === "-") &&
					next(elem);
		};
	}

	function _element(next, data){
		var name = data.name,
			value = data.value;
		if (data.name === 'class') {
			let value = data.value;
			if (/\s/.test(value)) return function() { return false }
			return function(elem) {
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

			return function(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && regex.test(attr) && next(elem);
			}
		}
	}

	function _exists(next, data){
		var name = data.name;
		return function(elem){
			return adapter.hasAttrib(elem, name) && next(elem);
		};
	}

	function _start(next, data){
		var name  = data.name,
			value = data.value,
			len = value.length;

		if(len === 0){
			return falseFunc;
		}

		if(data.ignoreCase){
			value = value.toLowerCase();

			return function (elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.substr(0, len).toLowerCase() === value && next(elem);
			};
		}

		return function (elem){
			var attr = adapter.getAttributeValue(elem, name);
			return attr != null && attr.substr(0, len) === value && next(elem);
		}
	}

	function _end(next, data){
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

		return function (elem){
			var attr = adapter.getAttributeValue(elem, name);
			return attr != null && attr.substr(len) === value && next(elem);
		};
	}

	function _any(next, data){
		var name  = data.name,
			value = data.value;

		if(value === ""){
			return falseFunc;
		}

		if(data.ignoreCase){
			var regex = new RegExp(value.replace(reChars, "\\$&"), "i");

			return function (elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && regex.test(attr) && next(elem);
			};
		}

		return function (elem){
			var attr = adapter.getAttributeValue(elem, name);
			return attr != null && attr.indexOf(value) >= 0 && next(elem);
		};
	}

	function _not(next, data){
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

	let attributeRules = new Map([
		['equals', _equals],
		['hyphen', _hyphen],
		['element', _element],
		['exists', _exists],
		['start', _start],
		['end', _end],
		['any', _any],
		['not', _not]
	]);

	return {
		compile: function(next, data, options){
			if(options && options.strict && (
				data.ignoreCase || data.action === "not"
			)) throw new Error("Unsupported attribute selector");
			return attributeRules.get(data.action)(next, data);
		},
		rules: attributeRules
	};
}

var attributes$1 = factory;

function generalFactory(adapter, Pseudos){

	//tags
	function _tag(next, data){
		var name = data.name;
		return function tag(elem){
			return adapter.getNameWithoutNS(elem) === name && next(elem);
		}
	}

	//traversal
	function _descendant(next){
		return function descendant(elem){
			var found = false;
			while(!found && (elem = adapter.getParent(elem))){
				found = next(elem);
			}
			return found;
		};
	}

	function __flexibleDescendant(next){
		// Include element itself, only used while querying an array
		return function descendant(elem){
			var found = next(elem);
			while(!found && (elem = adapter.getParent(elem))){
				found = next(elem);
			}
			return found;
		};
	}

	function _parent(next, data, options){
		if(options && options.strict) throw new Error("Parent selector isn't part of CSS3");

		return function parent(elem){
			return adapter.getChildren(elem).some(test);
		};

		function test(elem){
			return adapter.isTag(elem) && next(elem);
		}
	}

	function _child(next){
		return function child(elem){
			var parent = adapter.getParent(elem);
			return !!parent && next(parent);
		};
	}

	function _sibling(next){
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
	}

	function _adjacent(next){
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
	}

	function _universal(next){
		return next;
	}

	const generalRules = new Map([
		['attribute', attributes$1(adapter).compile],
		['pseudo', Pseudos.compile],
		['tag', _tag],
		['descendant', _descendant],
		['_flexibleDescendant', __flexibleDescendant],
		['parent', _parent],
		['child', _child],
		['sibling', _sibling],
		['adjacent', _adjacent],
		['universal', _universal],
	]);

	return generalRules
}

var general = generalFactory;

/*
	pseudo selectors

	---

	they are available in two forms:
	* filters called when the selector
	  is compiled and return a function
	  that needs to return next()
	* pseudos get called on execution
	  they need to return a boolean
*/

var trueFunc          = boolbase.trueFunc,
	falseFunc$1         = boolbase.falseFunc;

function filtersFactory(adapter){
	var attributes  = attributes$1(adapter),
		checkAttrib = attributes.rules.get('equals');

	//helper methods
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

	function _contains (next, text){
		return function (elem){
			return next(elem) && adapter.getText(elem).indexOf(text) >= 0;
		}
	}

	function _icontains (next, text){
		var itext = text.toLowerCase();
		return function (elem){
			return next(elem) &&
				adapter.getText(elem).toLowerCase().indexOf(itext) >= 0;
		}
	}

	function _nthChild (next, rule){
		var func = nthCheck(rule);
		if(func === falseFunc$1) return func;
		if(func === trueFunc)  return getChildFunc(next);
		return function (elem) {
			var siblings = adapter.getSiblings(elem);
			for(var i = 0, pos = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					else pos++;
				}
			}
			return func(pos) && next(elem);
		}
	}

	function _nthLastChild (next, rule){
		var func = nthCheck(rule);
		if(func === falseFunc$1) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function (elem){
			var siblings = adapter.getSiblings(elem);
			for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					else pos++;
				}
			}
			return func(pos) && next(elem);
		}
	}

	function _nthOfType (next, rule){
		var func = nthCheck(rule);

		if(func === falseFunc$1) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function (elem) {
			var siblings = adapter.getSiblings(elem);

			for(var pos = 0, i = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					if(adapter.getName(siblings[i]) === adapter.getName(elem)) pos++;
				}
			}

			return func(pos) && next(elem);
		}
	}

	function _nthLastOfType (next, rule){
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
		}
	}

	function _root (next){
		return function (elem){
			return !adapter.getParent(elem) && next(elem);
		}
	}

	function _scope (next, rule, options, context){
		if(!context || context.length === 0){
			//equivalent to :root
			return filters.get('root')(next);
		}
		if(context.length === 1){
			//NOTE: can't be unpacked, as :has uses this for side-effects
			return function (elem){
				return equals(context[0], elem) && next(elem);
			}
		}
		return function (elem){
			return context.indexOf(elem) >= 0 && next(elem);
		};
	}

	const filters = new Map([
		['contains', _contains],
		['icontains', _icontains],
		['nth-child', _nthChild],
		['nth-last-child', _nthLastChild],
		['nth-of-type', _nthOfType],
		['nth-last-of-type', _nthLastOfType],
		['root', _root],
		['scope', _scope],
		['checkbox', getAttribFunc("type", "checkbox")],
		['file', getAttribFunc("type", "file")],
		['password', getAttribFunc("type", "password")],
		['radio', getAttribFunc("type", "radio")],
		['reset', getAttribFunc("type", "reset")],
		['image', getAttribFunc("type", "image")],
		['submit', getAttribFunc("type", "submit")]
	]);

	return filters
}

function pseudosFactory(adapter){
	//helper methods
	function getFirstElement(elems){
		for(var i = 0; elems && i < elems.length; i++){
			if(adapter.isTag(elems[i])) return elems[i];
		}
	}

	function _empty(elem){
		return !adapter.getChildren(elem).some(function(elem){
			return adapter.isTag(elem) || elem.type === "text";
		})
	}

	function _firstChild(elem){
		return getFirstElement(adapter.getSiblings(elem)) === elem;
	}

	function _lastChild(elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = siblings.length - 1; i >= 0; i--){
			if(siblings[i] === elem) return true;
			if(adapter.isTag(siblings[i])) break;
		}

		return false;
	}

	function _firstOfType (elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = 0; i < siblings.length; i++){
			if(adapter.isTag(siblings[i])){
				if(siblings[i] === elem) return true;
				if(adapter.getName(siblings[i]) === adapter.getName(elem)) break;
			}
		}

		return false;
	}

	function _lastOfType (elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = siblings.length - 1; i >= 0; i--){
			if(adapter.isTag(siblings[i])){
				if(siblings[i] === elem) return true;
				if(adapter.getName(siblings[i]) === adapter.getName(elem)) break;
			}
		}

		return false;
	}

	function _onlyOfType (elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = 0, j = siblings.length; i < j; i++){
			if(adapter.isTag(siblings[i])){
				if(siblings[i] === elem) continue;
				if(adapter.getName(siblings[i]) === adapter.getName(elem)) return false;
			}
		}

		return true;
	}

	function _onlyChild (elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = 0; i < siblings.length; i++){
			if(adapter.isTag(siblings[i]) && siblings[i] !== elem) return false;
		}

		return true;
	}

	//:matches(a, area, link)[href]
	function _link (elem){
		return adapter.hasAttrib(elem, "href");
	}

	//:matches([selected], select:not([multiple]):not(> option[selected]) > option:first-of-type)
	function _selected (elem){
		if(adapter.hasAttrib(elem, "selected")) return true;
		else if(adapter.getName(elem) !== "option") return false;

		//the first <option> in a <select> is also selected
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
	}

	//https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
	//:matches(
	//  :matches(button, input, select, textarea, menuitem, optgroup, option)[disabled],
	//  optgroup[disabled] > option),
	// fieldset[disabled] * //TODO not child of first <legend>
	//)
	function _disabled (elem){
		return adapter.hasAttrib(elem, "disabled");
	}

	function _enabled(elem){
		return !adapter.hasAttrib(elem, "disabled");
	}

	//:matches(input, select, textarea)[required]
	function _required(elem){
		return adapter.hasAttrib(elem, "required");
	}

	//:matches(input, select, textarea):not([required])
	function _optional(elem){
		return !adapter.hasAttrib(elem, "required");
	}

	//:not(:empty)
	function _parent (elem){
		return !pseudos.get('empty')(elem);
	}

	//:matches(h1, h2, h3, h4, h5, h6)
	function _header (elem){
		var name = adapter.getName(elem);
		return name === "h1" ||
				name === "h2" ||
				name === "h3" ||
				name === "h4" ||
				name === "h5" ||
				name === "h6";
	}

	//:matches(button, input[type=button])
	function _button(elem){
		var name = adapter.getName(elem);
		return name === "button" ||
				name === "input" &&
				adapter.getAttributeValue(elem, "type") === "button";
	}

	//:matches(input, textarea, select, button)
	function _input(elem){
		var name = adapter.getName(elem);
		return name === "input" ||
				name === "textarea" ||
				name === "select" ||
				name === "button";
	}

	//input:matches(:not([type!='']), [type='text' i])
	function _text(elem){
		var attr;
		return adapter.getName(elem) === "input" && (
			!(attr = adapter.getAttributeValue(elem, "type")) ||
			attr.toLowerCase() === "text"
		);
	}


	const pseudos = new Map([
		['empty', _empty],
		['first-child', _firstChild],
		['last-child', _lastChild],
		['first-of-type', _firstOfType],
		['last-of-type', _lastOfType],
		['only-of-type', _onlyOfType],
		['only-child', _onlyChild],
		['link', _link],
		['visited', falseFunc$1],
		['selected', _selected],
		['disabled', _disabled],
		['enabled', _enabled],
		['required', _required],
		['optional', _optional],
		['parent', _parent],
		['header', _header],
		['button', _button],
		['input', _input],
		['text', _text]
	]);

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

//FIXME this feels hacky
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

			let filter = filters.get(name);
			let pseudo = pseudos.get(name);
			if(typeof filter === "function"){
				verifyArgs(filter, name,  subselect);
				return filter(next, subselect, options, context);
			} else if(typeof pseudo === "function"){
				verifyArgs(pseudo, name, subselect);
				if(next === trueFunc) return pseudo;
				return function pseudoArgs(elem){
					return pseudo(elem, subselect) && next(elem);
				};
			} else {
				throw new Error("unmatched pseudo-class :" + name);
			}
		},
		filters,
		pseudos
	};
}

var pseudos = factory$1;

/*
	compiles a selector to an executable function
*/

var compile = compileFactory;

var trueFunc$1       = boolbase.trueFunc,
	falseFunc$2      = boolbase.falseFunc;

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

	//CSS 4 Spec (Draft): 3.3.1. Absolutizing a Scope-relative Selector
	//http://www.w3.org/TR/selectors4/#absolutizing
	function absolutize(token, context){
		//TODO better check if context is document
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
		return procedure.get(t.type) < 0;
	}

	function compileRules(rules, options, context){
		return rules.reduce(function(func, rule){
			if(func === falseFunc$2) return func;
			return Rules.get(rule.type)(func, rule, options, context);
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

	//:not, :has and :matches have to compile selectors
	//doing this in lib/pseudos.js would lead to circular dependencies,
	//so we add them here
	filters.set('not', function(next, token, options, context){
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
	});

	filters.set('has', function(next, token, options){
		var opts = {
			xmlMode: !!(options && options.xmlMode),
			strict: !!(options && options.strict)
		};

		//FIXME: Uses an array as a pointer to the current element (side effects)
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
	});

	filters.set('matches', function(next, token, options, context){
		var opts = {
			xmlMode: !!(options && options.xmlMode),
			strict: !!(options && options.strict),
			rootFunc: next
		};

		return compileToken(token, opts, context);
	});

	compile.compileToken = compileToken;
	compile.compileUnsafe = compileUnsafe;
	compile.Pseudos = Pseudos;

	return compile;
}

var cssSelect = CSSselect;

var falseFunc$3      = boolbase.falseFunc,
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
		var compile = adapterCompile(options.adapter);

		if(typeof query !== "function") query = compile.compileUnsafe(query, options, elems);
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
	// Order matters because jQuery seems to check the children before the siblings
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
	var compile = adapterCompile(options.adapter);
	return (typeof query === "function" ? query : compile(query, options))(elem);
}

/*
	the exported interface
*/
function CSSselect(query, elems, options){
	return selectAll(query, elems, options);
}

CSSselect.compile = defaultCompile;
CSSselect.filters = defaultCompile.Pseudos.filters;
CSSselect.pseudos = defaultCompile.Pseudos.pseudos;

CSSselect.selectAll = selectAll;
CSSselect.selectOne = selectOne;

CSSselect.is = is;

//legacy methods (might be removed)
CSSselect.parse = defaultCompile;
CSSselect.iterate = selectAll;

//hooks
CSSselect._compileUnsafe = defaultCompile.compileUnsafe;
CSSselect._compileToken = defaultCompile.compileToken;

export default cssSelect;
