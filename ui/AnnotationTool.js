'use strict';

var SurfaceTool = require('./SurfaceTool');

/*
 * Abstract class for annotation tools like StrongTool, EmphasisTool, LinkTool.
 *
 * @class
 * @extends module:ui/tools.SurfaceTool
 * @memberof module:ui/tools
 */

function AnnotationTool() {
  SurfaceTool.apply(this, arguments);
}

AnnotationTool.Prototype = function() {
};

SurfaceTool.extend(AnnotationTool);
module.exports = AnnotationTool;
