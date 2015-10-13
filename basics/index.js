'use strict';

var _ = require('./helpers');

/**
 * Substance.Basics
 * ----------------
 * A collection of helpers pulled together from different sources, such as lodash.
 *
 * @module Basics
 */
var Basics = {};

_.extend(Basics, require('./helpers'));
_.extend(Basics, require('./oo'));

/**
 * @property {object} OO helper functions for object-oriented programming.
 * @memberof module:Basics
 */
Basics.OO = require('./oo');

/**
 * @property {class} An adapter to access an object via path
 * @memberof module:Basics
 */
Basics.PathAdapter = require('./path_adapter');


Basics.EventEmitter = require('./event_emitter');
Basics.Error = require('./error');
Basics.Registry = require('./registry');
Basics.Factory = require('./factory');
_.extend(Basics, require('./timer'));

Basics.jQuery = require('./jquery');
Basics.$ = Basics.jQuery;

module.exports = Basics;