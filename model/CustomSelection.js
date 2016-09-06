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

  this.toString = function() {
    /* istanbul ignore next */
    return [
      'CustomSelection(',
      this.customType,', ',
      JSON.stringify(this.data),
      ")"
    ].join('');
  };

  this.equals = function(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      other.isCustomSelection() &&
      isEqual(this.data, other.data)
    );
  };

  this._clone = function() {
    return new CustomSelection(this.customType, this.data, this.surfaceId);
  };

};

Selection.extend(CustomSelection);

CustomSelection.fromJSON = function(json) {
  return new CustomSelection(json.customType, json.data || {}, json.surfaceId);
};

module.exports = CustomSelection;
