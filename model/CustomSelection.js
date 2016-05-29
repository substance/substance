'use strict';

var cloneDeep = require('lodash/cloneDeep');
var isEqual = require('lodash/isEqual');

var Selection = require('./Selection');

function CustomSelection(type, data, surfaceId) {
  Selection.call(this);

  this.type = type;
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
    return this.type;
  };

  this.toJSON = function() {
    return {
      type: this.getType(),
      data: cloneDeep(this.data),
      surfaceId: this.surfaceId
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
  return new CustomSelection(json.type, json.data || {}, json.surfaceId);
};

module.exports = CustomSelection;
