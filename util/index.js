'use strict';

var _ = require('./helpers');

/**
 * Substance.util
 * ----------------
 * A collection of helpers pulled together from different sources, such as lodash.
 *
 * @module util
 */
var util = {};

_.extend(util, require('./helpers'));
_.extend(util, require('./oo'));

/**
 * @property {object} OO helper functions for object-oriented programming.
 * @memberof module:util
 */
util.OO = require('./oo');

/**
 * @property {class} An adapter to access an object via path
 * @memberof module:util
 */
util.PathAdapter = require('./PathAdapter');

util.EventEmitter = require('./EventEmitter');
util.Registry = require('./Registry');
util.Factory = require('./Factory');

util.jQuery = require('./jquery');
util.$ = util.jQuery;

module.exports = util;
