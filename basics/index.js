'use strict';

var _ = require('./helpers');

/**
 * Substance.Basics
 * ----------------
 * A collection of helpers pulled together from different sources, such as lodash.
 *
 * @module Basics
 * @main Basics
 */
var Basics = {};

_.extend(Basics, require('./helpers'));
_.extend(Basics, require('./oo'));
Basics.OO = require('./oo');
Basics.PathAdapter = require('./path_adapter');
Basics.EventEmitter = require('./event_emitter');
Basics.Error = require('./error');
Basics.Registry = require('./registry');
Basics.Factory = require('./factory');
_.extend(Basics, require('./tic'));

module.exports = Basics;
