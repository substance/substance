'use strict';

import breakList from './breakList'

export default {

  register: function(behavior) {
    behavior
      .defineBreak('list-item', breakList);
  }

};
