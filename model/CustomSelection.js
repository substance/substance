'use strict';

var cloneDeep = require('lodash/cloneDeep');
var isEqual = require('lodash/isEqual');

var Selection = require('./Selection');

function CustomSelection(data, surfaceId) {
  Selection.call(this);

  this.data = data;
  this.surfaceId = surfaceId;
}

CustomSelection.Prototype = function() {

  this.toString = function() {
    return "custom(", JSON.stringify(this.data) + ")";
  };

  this.isCustomSelection = function() {
    return true;
  };

  this.getType = function() {
    return 'custom';
  };

  this.toJSON = function() {
    return {
      type: this.getType(),
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
