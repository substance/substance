'use strict';

var Annotation = require('../../document/annotation');

var Emphasis = Annotation.extend({
  name: "emphasis",
  displayName: "Emphasis",
  splitContainerSelections: true
});

Emphasis.static.tagName = "em";

Emphasis.static.matchElement = function($el) {
  return $el.is("em,i");
};

module.exports = Emphasis;
