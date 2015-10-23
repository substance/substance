'use strict';

/**
 * Substance.Data
 * --------------
 * Provides a data model with a simple CRUD style manuipulation API,
 * support for OT based incremental manipulations, etc.
 *
 * @module Data
 */

var Data = require('./data');

Data.Incremental = require('./incremental_data');
Data.Node = require('./node');
Data.Schema = require('./schema');
Data.Index = require('./node_index');

module.exports = Data;
