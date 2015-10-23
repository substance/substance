'use strict';

var Annotation = require('../../model/Annotation');

var Strong = Annotation.extend({
  displayName: "Strong",
  name: "strong",

  // this means that it will annotate also when you have
  // selected multiple paragraphs, creating a single annotation
  // for every paragraph
  splitContainerSelections: true

});

Strong.static.tagName = 'strong';

Strong.static.matchElement = function($el) {
  return $el.is('strong,b');
};

module.exports = Strong;
