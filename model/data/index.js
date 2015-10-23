'use strict';

/**
 * Substance.Data
 * --------------
 * Provides a data model with a simple CRUD style manuipulation API,
 * support for OT based incremental manipulations, etc.
 *
 * @module Data
 */

var Data = require('./Data');

Data.Incremental = require('./IncrementalData');
Data.Node = require('./Node');
Data.Schema = require('./Schema');
Data.Index = require('./NodeIndex');

module.exports = Data;
