'use strict';

/*
 * Mostly taken from lodash.
 *
 * @module Basics/Helpers
 * @static
 * @memberof module:Basics
 */
var Helpers = {};
var $ = require('./jquery');
var deleteFromArray = require('./deleteFromArray');

// Lang helpers

/*
 * See https://lodash.com/docs#isEqual
 * @method isEqual
 */
Helpers.isEqual = require('lodash/lang/isEqual');
/*
 * See https://lodash.com/docs#isObject
 * @method isObject
 */
Helpers.isObject = require('lodash/lang/isObject');
/*
 * See https://lodash.com/docs#isArray
 * @method isArray
 */
Helpers.isArray = require('lodash/lang/isArray');
/*
 * See https://lodash.com/docs#isString
 * @method isString
 */
Helpers.isString = require('lodash/lang/isString');
/*
 * See https://lodash.com/docs#isNumber
 * @method isNumber
 */
Helpers.isNumber = require('lodash/lang/isNumber');
/*
 * See https://lodash.com/docs#isBoolean
 * @method isBoolean
 */
Helpers.isBoolean = require('lodash/lang/isBoolean');
/*
 * See https://lodash.com/docs#isFunction
 * @method isFunction
 */
Helpers.isFunction = require('lodash/lang/isFunction');
/*
 * See https://lodash.com/docs#cloneDeep
 * @method cloneDeep
 */
Helpers.cloneDeep = require('lodash/lang/cloneDeep');

/*
 * See https://lodash.com/docs#clone
 * @method clone
 */
Helpers.clone = require('lodash/lang/clone');

/*
 * See https://lodash.com/docs#isEmpty
 * @method isEmpty
 */
Helpers.isEmpty = require('lodash/lang/isEmpty');

// Function helpers

/*
 * See https://lodash.com/docs#bind
 * @method bind
 */
Helpers.bind = require('lodash/function/bind');
/*
 * See https://lodash.com/docs#delay
 * @method delay
 */
Helpers.delay = require('lodash/function/delay');
/*
 * See https://lodash.com/docs#debounce
 * @method debounce
 */
Helpers.debounce = require('lodash/function/debounce');

// Object helpers

/*
 * See https://lodash.com/docs#extend
 * @method extend
 */
Helpers.extend = require('lodash/object/extend');
/*
 * See https://lodash.com/docs#omit
 * @method omit
 */
Helpers.omit = require('lodash/object/omit');
/*
 * See https://lodash.com/docs#values
 * @method values
 */
Helpers.values = require('lodash/object/values');

// Array helpers

/*
 * See https://lodash.com/docs#last
 * @method last
 */
Helpers.last = require('lodash/array/last');
/*
 * See https://lodash.com/docs#first
 * @method first
 */
Helpers.first = require('lodash/array/first');
/*
 * See https://lodash.com/docs#compact
 * @method compact
 */
Helpers.compact = require('lodash/array/compact');
/*
 * See https://lodash.com/docs#uniq
 * @method uniq
 */
Helpers.uniq = require('lodash/array/uniq');
/*
 * See https://lodash.com/docs#intersection
 * @method intersection
 */
Helpers.intersection = require('lodash/array/intersection');
/*
 * See https://lodash.com/docs#union
 * @method union
 */
Helpers.union = require('lodash/array/union');
/*
 * See https://lodash.com/docs#without
 * @method without
 */
Helpers.without = require('lodash/array/without');

// Collection helpers

/*
 * See https://lodash.com/docs#each
 * @method each
 */
Helpers.each = require('lodash/collection/forEach');
/*
 * See https://lodash.com/docs#filter
 * @method filter
 */
Helpers.filter = require('lodash/collection/filter');
/*
 * See https://lodash.com/docs#includes
 * @method includes
 */
Helpers.includes = require('lodash/collection/includes');
/*
 * See https://lodash.com/docs#find
 * @method find
 */
Helpers.find = require('lodash/collection/find');
/*
 * See https://lodash.com/docs#map
 * @method map
 */
Helpers.map = require('lodash/collection/map');
/*
 * See https://lodash.com/docs#pluck
 * @method pluck
 */
Helpers.pluck = require('lodash/collection/pluck');
/*
 * See https://lodash.com/docs#indexBy
 * @method indexBy
 */
Helpers.indexBy = require('lodash/collection/indexBy');
/*
 * See https://lodash.com/docs#sortBy
 * @method sortBy
 */
Helpers.sortBy = require('lodash/collection/sortBy');

// String helpers

/*
 * See https://lodash.com/docs#capitalize
 * @method capitalize
 */
Helpers.capitalize = require('lodash/string/capitalize');

/*
 * Check if two arrays are equal.
 *
 * @method isArrayEqual
 * @param {Array} a
 * @param {Array} b
 * @deprecated use `Helpers.isEqual` instead.
 */
Helpers.isArrayEqual = function(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

/*
 * Removes all occurrence of value in array using Array.splice
 * I.e., this changes the array instead of creating a new one
 * as _.without() does.
 *
 * @method deleteFromArray
 * @param {Array} array
 * @param value
 */
Helpers.deleteFromArray = deleteFromArray;

/*
 * Clones a given object.
 * Uses obj.clone() if available, otherwise delegates to _.cloneDeep().
 *
 * @method clone
 * @param {Object} obj
 * @return The cloned object.
 */
Helpers.deepclone = function(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Helpers.isFunction(obj.clone)) {
    return obj.clone();
  }
  return Helpers.deepclone(obj);
};

/*
 * Alias for {{#crossLink "Helpers/cloneDeep:method"}}{{/crossLink}}.
 * @method deepClone
 */
Helpers.deepclone = Helpers.cloneDeep;

/*
 * Web helper to compute the relative offset of an element to an ancestor element.
 *
 * @method getRelativeOffset
 * @param {jQuery.Selector} $element
 * @param {jQuery.Selector} $ancestor
 * @return An object with properties
 *   - top: Number
 *   - left: Number
 */
Helpers.getRelativeOffset = function ( $element, $ancestor ) {
  var pos = $element.offset();
  var ancestorPos = $ancestor.offset();
  pos.left -= ancestorPos.left;
  pos.top -= ancestorPos.top;
  return pos;
};

Helpers.uuid = require('./uuid');

Helpers.serializeDOMElement = function($el) {
  var $tmp = $('<div>');
  $tmp.append($el.clone());
  return $tmp.html();
};

Helpers.request = function(method, url, data, cb) {
  var ajaxOpts = {
    type: method,
    url: url,
    contentType: "application/json; charset=UTF-8",
    // dataType: "json",
    success: function(data) {
      cb(null, data);
    },
    error: function(err) {
      console.error(err);
      cb(err.responseText);
    }
  };

  if (data) {
    ajaxOpts.data = JSON.stringify(data);
  }

  $.ajax(ajaxOpts);
};

module.exports = Helpers;
