'use strict';

var AnnotationTool = require('../../ui/AnnotationTool');

function LinkTool() {
  LinkTool.super.apply(this, arguments);
}

AnnotationTool.extend(LinkTool);
LinkTool.static.name = 'link';

module.exports = LinkTool;