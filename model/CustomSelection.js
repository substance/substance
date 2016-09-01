'use strict';

import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import Selection from './Selection'

class CustomSelection extends Selection {
  constructor(customType, data, surfaceId) {
    super()

    this.customType = customType;
    this.data = data;

    this.surfaceId = surfaceId;
  }

  isCustomSelection() {
    return true;
  }

  getType() {
    return 'custom';
  }

  getCustomType() {
    return this.customType;
  }

  toJSON() {
    return {
      type: 'custom',
      customType: this.customType,
      data: cloneDeep(this.data),
      surfaceId: this.surfaceId
    };
  }

  toString() {
    /* istanbul ignore next */
    return [
      'CustomSelection(',
      this.customType,', ',
      JSON.stringify(this.data),
      ")"
    ].join('');
  }

  equals(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      other.isCustomSelection() &&
      isEqual(this.data, other.data)
    );
  }

  _clone() {
    return new CustomSelection(this.customType, this.data, this.surfaceId)
  }
}

CustomSelection.fromJSON = function(json) {
  return new CustomSelection(json.customType, json.data || {}, json.surfaceId);
}

export default CustomSelection
