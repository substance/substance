"use strict";

var OO = require('../util/oo');

function EditingBehavior() {
  this._merge = {};
  this._mergeComponents = {};
  this._break = {};
}

EditingBehavior.Prototype = function() {

  this.defineMerge = function(firstType, secondType, impl) {
    if (!this._merge[firstType]) {
      this._merge[firstType] = {};
    }
    this._merge[firstType][secondType] = impl;
    return this;
  };

  this.canMerge = function(firstType, secondType) {
    return (this._merge[firstType] && this._merge[firstType][secondType]);
  };

  this.getMerger = function(firstType, secondType) {
    return this._merge[firstType][secondType];
  };

  this.defineComponentMerge = function(nodeType, impl) {
    this._mergeComponents[nodeType] = impl;
  };

  this.canMergeComponents = function(nodeType) {
    return this._mergeComponents[nodeType];
  };

  this.getComponentMerger = function(nodeType) {
    return this._mergeComponents[nodeType];
  };

  this.defineBreak = function(nodeType, impl) {
    this._break[nodeType] = impl;
    return this;
  };

  this.canBreak = function(nodeType) {
    return this._break[nodeType];
  };

  this.getBreaker = function(nodeType) {
    return this._break[nodeType];
  };

};

OO.initClass(EditingBehavior);

module.exports = EditingBehavior;
