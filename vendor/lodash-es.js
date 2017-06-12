function checkGlobal(value) {
  return (value && value.Object === Object) ? value : null;
}

var freeGlobal = checkGlobal(typeof global == 'object' && global);


var freeSelf = checkGlobal(typeof self == 'object' && self);


var thisGlobal = checkGlobal(typeof undefined == 'object' && undefined);


var root = freeGlobal || freeSelf || thisGlobal || Function('return this')();

var Symbol = root.Symbol;

function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

var symbolTag = '[object Symbol]';


var objectProto = Object.prototype;


var objectToString = objectProto.toString;


function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

var INFINITY = 1 / 0;


var symbolProto = Symbol ? Symbol.prototype : undefined;
var symbolToString = symbolProto ? symbolProto.toString : undefined;


function baseToString(value) {
  
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

function toString(value) {
  return value == null ? '' : baseToString(value);
}

function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

function castSlice(array, start, end) {
  var length = array.length;
  end = end === undefined ? length : end;
  return (!start && end >= length) ? array : baseSlice(array, start, end);
}

var rsAstralRange = '\\ud800-\\udfff';
var rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23';
var rsComboSymbolsRange = '\\u20d0-\\u20f0';
var rsVarRange = '\\ufe0e\\ufe0f';


var rsZWJ = '\\u200d';


var reHasComplexSymbol = RegExp('[' + rsZWJ + rsAstralRange  + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + ']');

var rsAstralRange$1 = '\\ud800-\\udfff';
var rsComboMarksRange$1 = '\\u0300-\\u036f\\ufe20-\\ufe23';
var rsComboSymbolsRange$1 = '\\u20d0-\\u20f0';
var rsVarRange$1 = '\\ufe0e\\ufe0f';


var rsAstral = '[' + rsAstralRange$1 + ']';
var rsCombo = '[' + rsComboMarksRange$1 + rsComboSymbolsRange$1 + ']';
var rsFitz = '\\ud83c[\\udffb-\\udfff]';
var rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')';
var rsNonAstral = '[^' + rsAstralRange$1 + ']';
var rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
var rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
var rsZWJ$1 = '\\u200d';


var reOptMod = rsModifier + '?';
var rsOptVar = '[' + rsVarRange$1 + ']?';
var rsOptJoin = '(?:' + rsZWJ$1 + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*';
var rsSeq = rsOptVar + reOptMod + rsOptJoin;
var rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';


var reComplexSymbol = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');


function stringToArray(string) {
  return string.match(reComplexSymbol);
}

function createCaseFirst(methodName) {
  return function(string) {
    string = toString(string);

    var strSymbols = reHasComplexSymbol.test(string)
      ? stringToArray(string)
      : undefined;

    var chr = strSymbols
      ? strSymbols[0]
      : string.charAt(0);

    var trailing = strSymbols
      ? castSlice(strSymbols, 1).join('')
      : string.slice(1);

    return chr[methodName]() + trailing;
  };
}

var upperFirst = createCaseFirst('toUpperCase');

function capitalize(string) {
  return upperFirst(toString(string).toLowerCase());
}

function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array ? array.length : 0;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

var deburredLetters = {
  '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
  '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
  '\xc7': 'C',  '\xe7': 'c',
  '\xd0': 'D',  '\xf0': 'd',
  '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
  '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
  '\xcC': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
  '\xeC': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
  '\xd1': 'N',  '\xf1': 'n',
  '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
  '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
  '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
  '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
  '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
  '\xc6': 'Ae', '\xe6': 'ae',
  '\xde': 'Th', '\xfe': 'th',
  '\xdf': 'ss'
};


function deburrLetter(letter) {
  return deburredLetters[letter];
}

var reLatin1 = /[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g;


var rsComboMarksRange$2 = '\\u0300-\\u036f\\ufe20-\\ufe23';
var rsComboSymbolsRange$2 = '\\u20d0-\\u20f0';


var rsCombo$1 = '[' + rsComboMarksRange$2 + rsComboSymbolsRange$2 + ']';


var reComboMark = RegExp(rsCombo$1, 'g');


function deburr(string) {
  string = toString(string);
  return string && string.replace(reLatin1, deburrLetter).replace(reComboMark, '');
}

var reBasicWord = /[a-zA-Z0-9]+/g;


var rsAstralRange$2 = '\\ud800-\\udfff';
var rsComboMarksRange$3 = '\\u0300-\\u036f\\ufe20-\\ufe23';
var rsComboSymbolsRange$3 = '\\u20d0-\\u20f0';
var rsDingbatRange = '\\u2700-\\u27bf';
var rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff';
var rsMathOpRange = '\\xac\\xb1\\xd7\\xf7';
var rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf';
var rsPunctuationRange = '\\u2000-\\u206f';
var rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000';
var rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde';
var rsVarRange$2 = '\\ufe0e\\ufe0f';
var rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;


var rsApos$1 = "['\u2019]";
var rsBreak = '[' + rsBreakRange + ']';
var rsCombo$2 = '[' + rsComboMarksRange$3 + rsComboSymbolsRange$3 + ']';
var rsDigits = '\\d+';
var rsDingbat = '[' + rsDingbatRange + ']';
var rsLower = '[' + rsLowerRange + ']';
var rsMisc = '[^' + rsAstralRange$2 + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']';
var rsFitz$1 = '\\ud83c[\\udffb-\\udfff]';
var rsModifier$1 = '(?:' + rsCombo$2 + '|' + rsFitz$1 + ')';
var rsNonAstral$1 = '[^' + rsAstralRange$2 + ']';
var rsRegional$1 = '(?:\\ud83c[\\udde6-\\uddff]){2}';
var rsSurrPair$1 = '[\\ud800-\\udbff][\\udc00-\\udfff]';
var rsUpper = '[' + rsUpperRange + ']';
var rsZWJ$2 = '\\u200d';


var rsLowerMisc = '(?:' + rsLower + '|' + rsMisc + ')';
var rsUpperMisc = '(?:' + rsUpper + '|' + rsMisc + ')';
var rsOptLowerContr = '(?:' + rsApos$1 + '(?:d|ll|m|re|s|t|ve))?';
var rsOptUpperContr = '(?:' + rsApos$1 + '(?:D|LL|M|RE|S|T|VE))?';
var reOptMod$1 = rsModifier$1 + '?';
var rsOptVar$1 = '[' + rsVarRange$2 + ']?';
var rsOptJoin$1 = '(?:' + rsZWJ$2 + '(?:' + [rsNonAstral$1, rsRegional$1, rsSurrPair$1].join('|') + ')' + rsOptVar$1 + reOptMod$1 + ')*';
var rsSeq$1 = rsOptVar$1 + reOptMod$1 + rsOptJoin$1;
var rsEmoji = '(?:' + [rsDingbat, rsRegional$1, rsSurrPair$1].join('|') + ')' + rsSeq$1;


var reComplexWord = RegExp([
  rsUpper + '?' + rsLower + '+' + rsOptLowerContr + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
  rsUpperMisc + '+' + rsOptUpperContr + '(?=' + [rsBreak, rsUpper + rsLowerMisc, '$'].join('|') + ')',
  rsUpper + '?' + rsLowerMisc + '+' + rsOptLowerContr,
  rsUpper + '+' + rsOptUpperContr,
  rsDigits,
  rsEmoji
].join('|'), 'g');


var reHasComplexWord = /[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;


function words(string, pattern, guard) {
  string = toString(string);
  pattern = guard ? undefined : pattern;

  if (pattern === undefined) {
    pattern = reHasComplexWord.test(string) ? reComplexWord : reBasicWord;
  }
  return string.match(pattern) || [];
}

var rsApos = "['\u2019]";


var reApos = RegExp(rsApos, 'g');


function createCompounder(callback) {
  return function(string) {
    return arrayReduce(words(deburr(string).replace(reApos, '')), callback, '');
  };
}

var camelCase = createCompounder(function(result, word, index) {
  word = word.toLowerCase();
  return result + (index ? capitalize(word) : word);
});

function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

function now() {
  return Date.now();
}

var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';


var objectProto$1 = Object.prototype;


var objectToString$1 = objectProto$1.toString;


function isFunction(value) {
  
  
  
  var tag = isObject(value) ? objectToString$1.call(value) : '';
  return tag == funcTag || tag == genTag;
}

var NAN = 0 / 0;


var reTrim = /^\s+|\s+$/g;


var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;


var reIsBinary = /^0b[01]+$/i;


var reIsOctal = /^0o[0-7]+$/i;


var freeParseInt = parseInt;


function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = isFunction(value.valueOf) ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

var FUNC_ERROR_TEXT = 'Expected a function';


var nativeMax = Math.max;
var nativeMin = Math.min;


function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    
    lastInvokeTime = time;
    
    timerId = setTimeout(timerExpired, wait);
    
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    
    
    
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    
    
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

var isArray = Array.isArray;

function isHostObject(value) {
  
  
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

var coreJsData = root['__core-js_shared__'];

var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());


function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

var funcToString$1 = Function.prototype.toString;


function toSource(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;


var reIsHostCtor = /^\[object .+?Constructor\]$/;


var objectProto$2 = Object.prototype;


var funcToString = Function.prototype.toString;


var hasOwnProperty = objectProto$2.hasOwnProperty;


var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);


function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

function getValue(object, key) {
  return object == null ? undefined : object[key];
}

function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

var nativeCreate = getNative(Object, 'create');

function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

var HASH_UNDEFINED = '__lodash_hash_undefined__';


var objectProto$3 = Object.prototype;


var hasOwnProperty$1 = objectProto$3.hasOwnProperty;


function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty$1.call(data, key) ? data[key] : undefined;
}

var objectProto$4 = Object.prototype;


var hasOwnProperty$2 = objectProto$4.hasOwnProperty;


function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty$2.call(data, key);
}

var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';


function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
  return this;
}

function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}


Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

function listCacheClear() {
  this.__data__ = [];
}

function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

var arrayProto = Array.prototype;


var splice = arrayProto.splice;


function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}


ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

var Map = getNative(root, 'Map');

function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}


MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

var FUNC_ERROR_TEXT$1 = 'Expected a function';


function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT$1);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}


memoize.Cache = MapCache;

var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g;


var reEscapeChar = /\\(\\)?/g;


var stringToPath = memoize(function(string) {
  var result = [];
  toString(string).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp = /^\w*$/;


function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

var INFINITY$1 = 1 / 0;


function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
}

function baseGet(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

function stackClear() {
  this.__data__ = new ListCache;
}

function stackDelete(key) {
  return this.__data__['delete'](key);
}

function stackGet(key) {
  return this.__data__.get(key);
}

function stackHas(key) {
  return this.__data__.has(key);
}

var LARGE_ARRAY_SIZE = 200;


function stackSet(key, value) {
  var cache = this.__data__;
  if (cache instanceof ListCache && cache.__data__.length == LARGE_ARRAY_SIZE) {
    cache = this.__data__ = new MapCache(cache.__data__);
  }
  cache.set(key, value);
  return this;
}

function Stack(entries) {
  this.__data__ = new ListCache(entries);
}


Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';


function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED$2);
  return this;
}

function setCacheHas(value) {
  return this.__data__.has(value);
}

function SetCache(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}


SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

function arraySome(array, predicate) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

var UNORDERED_COMPARE_FLAG$1 = 1;
var PARTIAL_COMPARE_FLAG$2 = 2;


function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG$2,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  
  var stacked = stack.get(array);
  if (stacked) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & UNORDERED_COMPARE_FLAG$1) ? new SetCache : undefined;

  stack.set(array, other);

  
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!seen.has(othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
              return seen.add(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, customizer, bitmask, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  return result;
}

var Uint8Array = root.Uint8Array;

function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

var UNORDERED_COMPARE_FLAG$2 = 1;
var PARTIAL_COMPARE_FLAG$3 = 2;


var boolTag = '[object Boolean]';
var dateTag = '[object Date]';
var errorTag = '[object Error]';
var mapTag = '[object Map]';
var numberTag = '[object Number]';
var regexpTag = '[object RegExp]';
var setTag = '[object Set]';
var stringTag = '[object String]';
var symbolTag$1 = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]';
var dataViewTag = '[object DataView]';


var symbolProto$1 = Symbol ? Symbol.prototype : undefined;
var symbolValueOf = symbolProto$1 ? symbolProto$1.valueOf : undefined;


function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
      
      
      
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      
      return (object != +object) ? other != +other : object == +other;

    case regexpTag:
    case stringTag:
      
      
      
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG$3;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= UNORDERED_COMPARE_FLAG$2;
      stack.set(object, other);

      
      return equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);

    case symbolTag$1:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

var nativeGetPrototype = Object.getPrototypeOf;


function getPrototype(value) {
  return nativeGetPrototype(Object(value));
}

var objectProto$6 = Object.prototype;


var hasOwnProperty$4 = objectProto$6.hasOwnProperty;


function baseHas(object, key) {
  
  
  
  return object != null &&
    (hasOwnProperty$4.call(object, key) ||
      (typeof object == 'object' && key in object && getPrototype(object) === null));
}

var nativeKeys = Object.keys;


function baseKeys(object) {
  return nativeKeys(Object(object));
}

function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

var getLength = baseProperty('length');

var MAX_SAFE_INTEGER = 9007199254740991;


function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

function isArrayLike(value) {
  return value != null && isLength(getLength(value)) && !isFunction(value);
}

function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

var argsTag$1 = '[object Arguments]';


var objectProto$7 = Object.prototype;


var hasOwnProperty$5 = objectProto$7.hasOwnProperty;


var objectToString$2 = objectProto$7.toString;


var propertyIsEnumerable = objectProto$7.propertyIsEnumerable;


function isArguments(value) {
  
  return isArrayLikeObject(value) && hasOwnProperty$5.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString$2.call(value) == argsTag$1);
}

var stringTag$1 = '[object String]';


var objectProto$8 = Object.prototype;


var objectToString$3 = objectProto$8.toString;


function isString(value) {
  return typeof value == 'string' ||
    (!isArray(value) && isObjectLike(value) && objectToString$3.call(value) == stringTag$1);
}

function indexKeys(object) {
  var length = object ? object.length : undefined;
  if (isLength(length) &&
      (isArray(object) || isString(object) || isArguments(object))) {
    return baseTimes(length, String);
  }
  return null;
}

var MAX_SAFE_INTEGER$1 = 9007199254740991;


var reIsUint = /^(?:0|[1-9]\d*)$/;


function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

var objectProto$9 = Object.prototype;


function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$9;

  return value === proto;
}

function keys(object) {
  var isProto = isPrototype(object);
  if (!(isProto || isArrayLike(object))) {
    return baseKeys(object);
  }
  var indexes = indexKeys(object),
      skipIndexes = !!indexes,
      result = indexes || [],
      length = result.length;

  for (var key in object) {
    if (baseHas(object, key) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length))) &&
        !(isProto && key == 'constructor')) {
      result.push(key);
    }
  }
  return result;
}

var PARTIAL_COMPARE_FLAG$4 = 2;


function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG$4,
      objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : baseHas(other, key))) {
      return false;
    }
  }
  
  var stacked = stack.get(object);
  if (stacked) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  return result;
}

var DataView = getNative(root, 'DataView');

var Promise = getNative(root, 'Promise');

var Set = getNative(root, 'Set');

var WeakMap = getNative(root, 'WeakMap');

var mapTag$1 = '[object Map]';
var objectTag$1 = '[object Object]';
var promiseTag = '[object Promise]';
var setTag$1 = '[object Set]';
var weakMapTag = '[object WeakMap]';

var dataViewTag$1 = '[object DataView]';


var objectProto$10 = Object.prototype;


var objectToString$4 = objectProto$10.toString;


var dataViewCtorString = toSource(DataView);
var mapCtorString = toSource(Map);
var promiseCtorString = toSource(Promise);
var setCtorString = toSource(Set);
var weakMapCtorString = toSource(WeakMap);


function getTag(value) {
  return objectToString$4.call(value);
}



if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
    (Map && getTag(new Map) != mapTag$1) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag$1) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = objectToString$4.call(value),
        Ctor = result == objectTag$1 ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag$1;
        case mapCtorString: return mapTag$1;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag$1;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

var getTag$1 = getTag;

var argsTag$2 = '[object Arguments]';
var arrayTag$1 = '[object Array]';
var boolTag$1 = '[object Boolean]';
var dateTag$1 = '[object Date]';
var errorTag$1 = '[object Error]';
var funcTag$1 = '[object Function]';
var mapTag$2 = '[object Map]';
var numberTag$1 = '[object Number]';
var objectTag$2 = '[object Object]';
var regexpTag$1 = '[object RegExp]';
var setTag$2 = '[object Set]';
var stringTag$2 = '[object String]';
var weakMapTag$1 = '[object WeakMap]';

var arrayBufferTag$1 = '[object ArrayBuffer]';
var dataViewTag$2 = '[object DataView]';
var float32Tag = '[object Float32Array]';
var float64Tag = '[object Float64Array]';
var int8Tag = '[object Int8Array]';
var int16Tag = '[object Int16Array]';
var int32Tag = '[object Int32Array]';
var uint8Tag = '[object Uint8Array]';
var uint8ClampedTag = '[object Uint8ClampedArray]';
var uint16Tag = '[object Uint16Array]';
var uint32Tag = '[object Uint32Array]';


var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$2] = typedArrayTags[arrayTag$1] =
typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] =
typedArrayTags[dataViewTag$2] = typedArrayTags[dateTag$1] =
typedArrayTags[errorTag$1] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] =
typedArrayTags[objectTag$2] = typedArrayTags[regexpTag$1] =
typedArrayTags[setTag$2] = typedArrayTags[stringTag$2] =
typedArrayTags[weakMapTag$1] = false;


var objectProto$11 = Object.prototype;


var objectToString$5 = objectProto$11.toString;


function isTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[objectToString$5.call(value)];
}

var PARTIAL_COMPARE_FLAG$1 = 2;


var argsTag = '[object Arguments]';
var arrayTag = '[object Array]';
var objectTag = '[object Object]';


var objectProto$5 = Object.prototype;


var hasOwnProperty$3 = objectProto$5.hasOwnProperty;


function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = getTag$1(object);
    objTag = objTag == argsTag ? objectTag : objTag;
  }
  if (!othIsArr) {
    othTag = getTag$1(other);
    othTag = othTag == argsTag ? objectTag : othTag;
  }
  var objIsObj = objTag == objectTag && !isHostObject(object),
      othIsObj = othTag == objectTag && !isHostObject(other),
      isSameTag = objTag == othTag;

  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
      : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
  }
  if (!(bitmask & PARTIAL_COMPARE_FLAG$1)) {
    var objIsWrapped = objIsObj && hasOwnProperty$3.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty$3.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
}

function baseIsEqual(value, other, customizer, bitmask, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
}

var UNORDERED_COMPARE_FLAG = 1;
var PARTIAL_COMPARE_FLAG = 2;


function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack;
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

function isStrictComparable(value) {
  return value === value && !isObject(value);
}

function getMatchData(object) {
  var result = keys(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, isStrictComparable(value)];
  }
  return result;
}

function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch(object, source, matchData);
  };
}

function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

function hasPath(object, path, hasFunc) {
  path = isKey(path, object) ? [path] : castPath(path);

  var result,
      index = -1,
      length = path.length;

  while (++index < length) {
    var key = toKey(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result) {
    return result;
  }
  var length = object ? object.length : 0;
  return !!length && isLength(length) && isIndex(key, length) &&
    (isArray(object) || isString(object) || isArguments(object));
}

function hasIn(object, path) {
  return object != null && hasPath(object, path, baseHasIn);
}

var UNORDERED_COMPARE_FLAG$3 = 1;
var PARTIAL_COMPARE_FLAG$5 = 2;


function baseMatchesProperty(path, srcValue) {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey(path), srcValue);
  }
  return function(object) {
    var objValue = get(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG$3 | PARTIAL_COMPARE_FLAG$5);
  };
}

function identity(value) {
  return value;
}

function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

function baseIteratee(value) {
  
  
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity;
  }
  if (typeof value == 'object') {
    return isArray(value)
      ? baseMatchesProperty(value[0], value[1])
      : baseMatches(value);
  }
  return property(value);
}

function createFind(findIndexFunc) {
  return function(collection, predicate, fromIndex) {
    var iterable = Object(collection);
    predicate = baseIteratee(predicate, 3);
    if (!isArrayLike(collection)) {
      var props = keys(collection);
    }
    var index = findIndexFunc(props || collection, function(value, key) {
      if (props) {
        key = value;
        value = iterable[key];
      }
      return predicate(value, key, iterable);
    }, fromIndex);
    return index > -1 ? collection[props ? props[index] : index] : undefined;
  };
}

function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

var INFINITY$2 = 1 / 0;
var MAX_INTEGER = 1.7976931348623157e+308;


function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY$2 || value === -INFINITY$2) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

function toInteger(value) {
  var result = toFinite(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

var nativeMax$1 = Math.max;


function findIndex(array, predicate, fromIndex) {
  var length = array ? array.length : 0;
  if (!length) {
    return -1;
  }
  var index = fromIndex == null ? 0 : toInteger(fromIndex);
  if (index < 0) {
    index = nativeMax$1(length + index, 0);
  }
  return baseFindIndex(array, baseIteratee(predicate, 3), index);
}

var find = createFind(findIndex);

function isMatch(object, source) {
  return object === source || baseIsMatch(object, source, getMatchData(source));
}

function arrayEach(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq(object[key], value)) ||
      (typeof key == 'number' && value === undefined && !(key in object))) {
    object[key] = value;
  }
}

var objectProto$12 = Object.prototype;


var hasOwnProperty$6 = objectProto$12.hasOwnProperty;


function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$6.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    object[key] = value;
  }
}

function copyObject(source, props, object, customizer) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : source[key];

    assignValue(object, key, newValue);
  }
  return object;
}

function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var result = new buffer.constructor(buffer.length);
  buffer.copy(result);
  return result;
}

function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

function stubArray() {
  return [];
}

var getOwnPropertySymbols = Object.getOwnPropertySymbols;


function getSymbols(object) {
  
  
  return getOwnPropertySymbols(Object(object));
}


if (!getOwnPropertySymbols) {
  getSymbols = stubArray;
}

var getSymbols$1 = getSymbols;

function copySymbols(source, object) {
  return copyObject(source, getSymbols$1(source), object);
}

function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols$1);
}

var objectProto$13 = Object.prototype;


var hasOwnProperty$7 = objectProto$13.hasOwnProperty;


function initCloneArray(array) {
  var length = array.length,
      result = array.constructor(length);

  
  if (length && typeof array[0] == 'string' && hasOwnProperty$7.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

function addMapEntry(map, pair) {
  
  map.set(pair[0], pair[1]);
  return map;
}

function cloneMap(map, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
  return arrayReduce(array, addMapEntry, new map.constructor);
}

var reFlags = /\w*$/;


function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

function addSetEntry(set, value) {
  set.add(value);
  return set;
}

function cloneSet(set, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
  return arrayReduce(array, addSetEntry, new set.constructor);
}

var symbolProto$2 = Symbol ? Symbol.prototype : undefined;
var symbolValueOf$1 = symbolProto$2 ? symbolProto$2.valueOf : undefined;


function cloneSymbol(symbol) {
  return symbolValueOf$1 ? Object(symbolValueOf$1.call(symbol)) : {};
}

function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

var boolTag$3 = '[object Boolean]';
var dateTag$3 = '[object Date]';
var mapTag$4 = '[object Map]';
var numberTag$3 = '[object Number]';
var regexpTag$3 = '[object RegExp]';
var setTag$4 = '[object Set]';
var stringTag$4 = '[object String]';
var symbolTag$3 = '[object Symbol]';

var arrayBufferTag$3 = '[object ArrayBuffer]';
var dataViewTag$4 = '[object DataView]';
var float32Tag$2 = '[object Float32Array]';
var float64Tag$2 = '[object Float64Array]';
var int8Tag$2 = '[object Int8Array]';
var int16Tag$2 = '[object Int16Array]';
var int32Tag$2 = '[object Int32Array]';
var uint8Tag$2 = '[object Uint8Array]';
var uint8ClampedTag$2 = '[object Uint8ClampedArray]';
var uint16Tag$2 = '[object Uint16Array]';
var uint32Tag$2 = '[object Uint32Array]';


function initCloneByTag(object, tag, cloneFunc, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag$3:
      return cloneArrayBuffer(object);

    case boolTag$3:
    case dateTag$3:
      return new Ctor(+object);

    case dataViewTag$4:
      return cloneDataView(object, isDeep);

    case float32Tag$2: case float64Tag$2:
    case int8Tag$2: case int16Tag$2: case int32Tag$2:
    case uint8Tag$2: case uint8ClampedTag$2: case uint16Tag$2: case uint32Tag$2:
      return cloneTypedArray(object, isDeep);

    case mapTag$4:
      return cloneMap(object, isDeep, cloneFunc);

    case numberTag$3:
    case stringTag$4:
      return new Ctor(object);

    case regexpTag$3:
      return cloneRegExp(object);

    case setTag$4:
      return cloneSet(object, isDeep, cloneFunc);

    case symbolTag$3:
      return cloneSymbol(object);
  }
}

var objectCreate = Object.create;


function baseCreate(proto) {
  return isObject(proto) ? objectCreate(proto) : {};
}

function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

function stubFalse() {
  return false;
}

var freeExports = typeof exports == 'object' && exports;


var freeModule = freeExports && typeof module == 'object' && module;


var moduleExports = freeModule && freeModule.exports === freeExports;


var Buffer = moduleExports ? root.Buffer : undefined;


var isBuffer = !Buffer ? stubFalse : function(value) {
  return value instanceof Buffer;
};

var argsTag$3 = '[object Arguments]';
var arrayTag$2 = '[object Array]';
var boolTag$2 = '[object Boolean]';
var dateTag$2 = '[object Date]';
var errorTag$2 = '[object Error]';
var funcTag$2 = '[object Function]';
var genTag$1 = '[object GeneratorFunction]';
var mapTag$3 = '[object Map]';
var numberTag$2 = '[object Number]';
var objectTag$3 = '[object Object]';
var regexpTag$2 = '[object RegExp]';
var setTag$3 = '[object Set]';
var stringTag$3 = '[object String]';
var symbolTag$2 = '[object Symbol]';
var weakMapTag$2 = '[object WeakMap]';

var arrayBufferTag$2 = '[object ArrayBuffer]';
var dataViewTag$3 = '[object DataView]';
var float32Tag$1 = '[object Float32Array]';
var float64Tag$1 = '[object Float64Array]';
var int8Tag$1 = '[object Int8Array]';
var int16Tag$1 = '[object Int16Array]';
var int32Tag$1 = '[object Int32Array]';
var uint8Tag$1 = '[object Uint8Array]';
var uint8ClampedTag$1 = '[object Uint8ClampedArray]';
var uint16Tag$1 = '[object Uint16Array]';
var uint32Tag$1 = '[object Uint32Array]';


var cloneableTags = {};
cloneableTags[argsTag$3] = cloneableTags[arrayTag$2] =
cloneableTags[arrayBufferTag$2] = cloneableTags[dataViewTag$3] =
cloneableTags[boolTag$2] = cloneableTags[dateTag$2] =
cloneableTags[float32Tag$1] = cloneableTags[float64Tag$1] =
cloneableTags[int8Tag$1] = cloneableTags[int16Tag$1] =
cloneableTags[int32Tag$1] = cloneableTags[mapTag$3] =
cloneableTags[numberTag$2] = cloneableTags[objectTag$3] =
cloneableTags[regexpTag$2] = cloneableTags[setTag$3] =
cloneableTags[stringTag$3] = cloneableTags[symbolTag$2] =
cloneableTags[uint8Tag$1] = cloneableTags[uint8ClampedTag$1] =
cloneableTags[uint16Tag$1] = cloneableTags[uint32Tag$1] = true;
cloneableTags[errorTag$2] = cloneableTags[funcTag$2] =
cloneableTags[weakMapTag$2] = false;


function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag$1(value),
        isFunc = tag == funcTag$2 || tag == genTag$1;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag$3 || tag == argsTag$3 || (isFunc && !object)) {
      if (isHostObject(value)) {
        return object ? value : {};
      }
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, baseClone, isDeep);
    }
  }
  
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (!isArr) {
    var props = isFull ? getAllKeys(value) : keys(value);
  }
  
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    assignValue(result, key, baseClone(subValue, isDeep, isFull, customizer, key, value, stack));
  });
  return result;
}

var objectTag$4 = '[object Object]';


var objectProto$14 = Object.prototype;


var funcToString$2 = Function.prototype.toString;


var hasOwnProperty$8 = objectProto$14.hasOwnProperty;


var objectCtorString = funcToString$2.call(Object);


var objectToString$6 = objectProto$14.toString;


function isPlainObject(value) {
  if (!isObjectLike(value) ||
      objectToString$6.call(value) != objectTag$4 || isHostObject(value)) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty$8.call(proto, 'constructor') && proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString$2.call(Ctor) == objectCtorString);
}

var Reflect = root.Reflect;

function iteratorToArray(iterator) {
  var data,
      result = [];

  while (!(data = iterator.next()).done) {
    result.push(data.value);
  }
  return result;
}

var objectProto$16 = Object.prototype;


var enumerate = Reflect ? Reflect.enumerate : undefined;
var propertyIsEnumerable$1 = objectProto$16.propertyIsEnumerable;


function baseKeysIn(object) {
  object = object == null ? object : Object(object);

  var result = [];
  for (var key in object) {
    result.push(key);
  }
  return result;
}


if (enumerate && !propertyIsEnumerable$1.call({ 'valueOf': 1 }, 'valueOf')) {
  baseKeysIn = function(object) {
    return iteratorToArray(enumerate(object));
  };
}

var baseKeysIn$1 = baseKeysIn;

var objectProto$15 = Object.prototype;


var hasOwnProperty$9 = objectProto$15.hasOwnProperty;


function keysIn(object) {
  var index = -1,
      isProto = isPrototype(object),
      props = baseKeysIn$1(object),
      propsLength = props.length,
      indexes = indexKeys(object),
      skipIndexes = !!indexes,
      result = indexes || [],
      length = result.length;

  while (++index < propsLength) {
    var key = props[index];
    if (!(skipIndexes && (key == 'length' || isIndex(key, length))) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty$9.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = object[key],
      srcValue = source[key],
      stacked = stack.get(srcValue);

  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    newValue = srcValue;
    if (isArray(srcValue) || isTypedArray(srcValue)) {
      if (isArray(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      }
      else {
        isCommon = false;
        newValue = baseClone(srcValue, true);
      }
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      }
      else if (!isObject(objValue) || (srcIndex && isFunction(objValue))) {
        isCommon = false;
        newValue = baseClone(srcValue, true);
      }
      else {
        newValue = objValue;
      }
    }
    else {
      isCommon = false;
    }
  }
  stack.set(srcValue, newValue);

  if (isCommon) {
    
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
  }
  stack['delete'](srcValue);
  assignMergeValue(object, key, newValue);
}

function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  if (!(isArray(source) || isTypedArray(source))) {
    var props = keysIn(source);
  }
  arrayEach(props || source, function(srcValue, key) {
    if (props) {
      key = srcValue;
      srcValue = source[key];
    }
    if (isObject(srcValue)) {
      stack || (stack = new Stack);
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(object[key], srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  });
}

function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

function apply(func, thisArg, args) {
  var length = args.length;
  switch (length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

var FUNC_ERROR_TEXT$2 = 'Expected a function';


var nativeMax$2 = Math.max;


function rest(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT$2);
  }
  start = nativeMax$2(start === undefined ? (func.length - 1) : toInteger(start), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax$2(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, array);
      case 1: return func.call(this, args[0], array);
      case 2: return func.call(this, args[0], args[1], array);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

function createAssigner(assigner) {
  return rest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

var merge = createAssigner(function(object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});

var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
  baseMerge(object, source, srcIndex, customizer);
});

function baseSet(object, path, value, customizer) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = toKey(path[index]);
    if (isObject(nested)) {
      var newValue = value;
      if (index != lastIndex) {
        var objValue = nested[key];
        newValue = customizer ? customizer(objValue, key, nested) : undefined;
        if (newValue === undefined) {
          newValue = objValue == null
            ? (isIndex(path[index + 1]) ? [] : {})
            : objValue;
        }
      }
      assignValue(nested, key, newValue);
    }
    nested = nested[key];
  }
  return object;
}

function setWith(object, path, value, customizer) {
  customizer = typeof customizer == 'function' ? customizer : undefined;
  return object == null ? object : baseSet(object, path, value, customizer);
}

function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

function arrayIncludes(array, value) {
  var length = array ? array.length : 0;
  return !!length && baseIndexOf(array, value, 0) > -1;
}

function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

function cacheHas(cache, key) {
  return cache.has(key);
}

function noop() {
  
}

var INFINITY$3 = 1 / 0;


var createSet = !(Set && (1 / setToArray(new Set([,-0]))[1]) == INFINITY$3) ? noop : function(values) {
  return new Set(values);
};

var LARGE_ARRAY_SIZE$1 = 200;


function baseUniq(array, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes,
      length = array.length,
      isCommon = true,
      result = [],
      seen = result;

  if (comparator) {
    isCommon = false;
    includes = arrayIncludesWith;
  }
  else if (length >= LARGE_ARRAY_SIZE$1) {
    var set = iteratee ? null : createSet(array);
    if (set) {
      return setToArray(set);
    }
    isCommon = false;
    includes = cacheHas;
    seen = new SetCache;
  }
  else {
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (!includes(seen, computed, comparator)) {
      if (seen !== result) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

function uniq(array) {
  return (array && array.length)
    ? baseUniq(array)
    : [];
}

function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

function parent(object, path) {
  return path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
}

function baseUnset(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);
  object = parent(object, path);

  var key = toKey(last(path));
  return !(object != null && baseHas(object, key)) || delete object[key];
}

function unset(object, path) {
  return object == null ? true : baseUnset(object, path);
}

function arrayMap(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

var LARGE_ARRAY_SIZE$2 = 200;


function baseDifference(array, values, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes,
      isCommon = true,
      length = array.length,
      result = [],
      valuesLength = values.length;

  if (!length) {
    return result;
  }
  if (iteratee) {
    values = arrayMap(values, baseUnary(iteratee));
  }
  if (comparator) {
    includes = arrayIncludesWith;
    isCommon = false;
  }
  else if (values.length >= LARGE_ARRAY_SIZE$2) {
    includes = cacheHas;
    isCommon = false;
    values = new SetCache(values);
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (!includes(values, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

var without = rest(function(array, values) {
  return isArrayLikeObject(array)
    ? baseDifference(array, values)
    : [];
});

function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

var baseFor = createBaseFor();

function baseForOwn(object, iteratee) {
  return object && baseFor(object, iteratee, keys);
}

function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

var baseEach = createBaseEach(baseForOwn);

function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

function baseSortBy(array, comparer) {
  var length = array.length;

  array.sort(comparer);
  while (length--) {
    array[length] = array[length].value;
  }
  return array;
}

function compareAscending(value, other) {
  if (value !== other) {
    var valIsDefined = value !== undefined,
        valIsNull = value === null,
        valIsReflexive = value === value,
        valIsSymbol = isSymbol(value);

    var othIsDefined = other !== undefined,
        othIsNull = other === null,
        othIsReflexive = other === other,
        othIsSymbol = isSymbol(other);

    if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
        (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
        (valIsNull && othIsDefined && othIsReflexive) ||
        (!valIsDefined && othIsReflexive) ||
        !valIsReflexive) {
      return 1;
    }
    if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
        (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
        (othIsNull && valIsDefined && valIsReflexive) ||
        (!othIsDefined && valIsReflexive) ||
        !othIsReflexive) {
      return -1;
    }
  }
  return 0;
}

function compareMultiple(object, other, orders) {
  var index = -1,
      objCriteria = object.criteria,
      othCriteria = other.criteria,
      length = objCriteria.length,
      ordersLength = orders.length;

  while (++index < length) {
    var result = compareAscending(objCriteria[index], othCriteria[index]);
    if (result) {
      if (index >= ordersLength) {
        return result;
      }
      var order = orders[index];
      return result * (order == 'desc' ? -1 : 1);
    }
  }
  
  
  
  
  
  
  
  return object.index - other.index;
}

function baseOrderBy(collection, iteratees, orders) {
  var index = -1;
  iteratees = arrayMap(iteratees.length ? iteratees : [identity], baseUnary(baseIteratee));

  var result = baseMap(collection, function(value, key, collection) {
    var criteria = arrayMap(iteratees, function(iteratee) {
      return iteratee(value);
    });
    return { 'criteria': criteria, 'index': ++index, 'value': value };
  });

  return baseSortBy(result, function(object, other) {
    return compareMultiple(object, other, orders);
  });
}

function orderBy(collection, iteratees, orders, guard) {
  if (collection == null) {
    return [];
  }
  if (!isArray(iteratees)) {
    iteratees = iteratees == null ? [] : [iteratees];
  }
  orders = guard ? undefined : orders;
  if (!isArray(orders)) {
    orders = orders == null ? [] : [orders];
  }
  return baseOrderBy(collection, iteratees, orders);
}

export { camelCase, capitalize, debounce, get, find, isMatch, merge, mergeWith, setWith, uniq, unset, without, orderBy };
