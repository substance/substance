'use strict';

import TextBlockComponent from '../../ui/TextBlockComponent'

function BlockquoteComponent() {
  BlockquoteComponent.super.apply(this, arguments);
}

BlockquoteComponent.Prototype = function() {

  var _super = BlockquoteComponent.super.prototype;

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    return el.addClass('sc-blockquote');
  };

};

TextBlockComponent.extend(BlockquoteComponent);

export default BlockquoteComponent;
