'use strict';

import oo from '../util/oo'

/**
 Default label provider implementation
*/

function LabelProvider(labels, lang) {
  this.lang = lang || 'en';
  this.labels = labels;
}

LabelProvider.Prototype = function() {

  this.getLabel = function(name) {
    var labels = this.labels[this.lang];
    if (!labels) return name;
    return labels[name] || name;
  };
};

oo.initClass(LabelProvider);

export default LabelProvider;
