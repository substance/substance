'use strict';

import Tool from '../packages/tools/Tool'

/*
 * Abstract class for annotation tools like StrongTool, EmphasisTool, LinkTool.
 *
 * @component
 */

function AnnotationTool() {
  Tool.apply(this, arguments);
}

AnnotationTool.Prototype = function() {
  var _super = AnnotationTool.super.prototype;

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    el.addClass('sm-annotation-tool');
    return el;
  };

  this.renderButton = function($$) {
    var el = _super.renderButton.call(this, $$);
    el.append(this.renderMode($$));
    return el;
  };

  /*
    Renders a small hint for the mode (expand, truncate, edit, etc)
  */
  this.renderMode = function($$) {
    var mode = this.props.mode;
    var el = $$('div').addClass('se-mode');

    var iconEl = this.context.iconProvider.renderIcon($$, mode);
    if (iconEl) {
      el.append(iconEl);
    }
    return el;
  };
};

Tool.extend(AnnotationTool);
export default AnnotationTool;
