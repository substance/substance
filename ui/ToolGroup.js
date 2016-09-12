'use strict';

import Component from './Component'

/**
  @class ToolGroup
  @component

  @prop {ui/VirtualDOMElement} name unique editor name

  @example

  ```js
  $$(ToolGroup).append(
    $$(StrongTool)
  )
  ```
*/
function ToolGroup() {
  Component.apply(this, arguments);
}

ToolGroup.Prototype = function() {
  this.render = function($$) {
    var el = $$('div').addClass('sc-tool-group');
    el.append(this.props.children);
    return el;
  };
};

Component.extend(ToolGroup);

export default ToolGroup;