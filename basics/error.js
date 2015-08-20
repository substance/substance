'use strict';

var OO = require('./oo');

/**
 * Base class for Substance errors.
 *
 * @class SubstanceError
 * @extends Error
 * @constructor
 * @module Basics
 */
function SubstanceError() {
  Error.apply(this, arguments);
}

OO.inherit(SubstanceError, Error);

module.exports = SubstanceError;
