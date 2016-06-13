'use strict';

var cloneDeep = require('lodash/cloneDeep');
var isEqual = require('lodash/isEqual');

var Selection = require('./Selection');

/*
  @
*/
function CustomSelection(customType, data, surfaceId) {
  Selection.call(this);

  this.customType = customType;
  this.data = data;

  this.surfaceId = surfaceId;
}

CustomSelection.Prototype = function() {

  this.toString = function() {
    return "custom(" + this.customType + ', ' + JSON.stringify(this.data) + ")";
  };

  this.isCustomSelection = function() {
    return true;
  };

  this.getType = function() {
    return 'custom';
  };

  this.getCustomType = function() {
    return this.customType;
  };

  this.toJSON = function() {
    return {
      type: 'custom',
      customType: this.customType,
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
  return new CustomSelection(json.customType, json.data || {}, json.surfaceId);
};

module.exports = CustomSelection;
