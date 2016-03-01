'use strict';

var isEqual = require('lodash/isEqual');
var cloneDeep = require('../util/cloneDeep');

var Selection = require('./Selection');

function CustomSelection(data) {
  Selection.call(this);

  this.data = data;
}

CustomSelection.Prototype = function() {

  this.toString = function() {
    return "custom(", JSON.stringify(this.data) + ")";
  };

  this.isCustomSelection = function() {
    return true;
  };

  this.toJSON = function() {
    return {
      type: 'custom',
      data: cloneDeep(this.data)
    };
  };

  this.equals = function(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      other.isCustomSelection() &&
      isEqual(this.data, other.data)
    );
  };

};

Selection.extend(CustomSelection);

CustomSelection.fromJSON = function(json) {
  return new CustomSelection(json.data || {});
};

module.exports = CustomSelection;
