'use strict';

import NodeComponent from './NodeComponent'
import TextProperty from './TextPropertyComponent'

function TextBlockComponent() {
  TextBlockComponent.super.apply(this, arguments);
}

TextBlockComponent.Prototype = function() {

  var _super = TextBlockComponent.super.prototype;

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    el.append($$(TextProperty, {
      path: [ this.props.node.id, "content"]
    }));
    return el;
  };

};

NodeComponent.extend(TextBlockComponent);

export default TextBlockComponent;
