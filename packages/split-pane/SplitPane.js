'use strict';

import Component from '../../ui/Component'

/**
  A split view layout component. Takes properties for configuration and 2 children via append.

  @class SplitPane
  @component

  @prop {String} splitType either 'vertical' (default) or 'horizontal'.
  @prop {String} sizeA size of the first pane (A). '40%' or '100px' or 'inherit' are valid values.
  @prop {String} sizeB size of second pane. sizeA and sizeB can not be combined.

  @example

  ```js
  $$(SplitPane, {
    sizeA: '30%',
    splitType: 'horizontal'
  }).append(
    $$('div').append('Pane A'),
    $$('div').append('Pane B')
  )
  ```
*/

function SplitPane() {
  Component.apply(this, arguments);
}

SplitPane.Prototype = function() {

  this.render = function($$) {
    if (this.props.children.length !== 2) {
      throw new Error('SplitPane only works with exactly two child elements');
    }

    var el = $$('div').addClass('sc-split-pane');
    if (this.props.splitType === 'horizontal') {
      el.addClass('sm-horizontal');
    } else {
      el.addClass('sm-vertical');
    }

    var paneA = this.props.children[0];
    var paneB = this.props.children[1];

    // Apply configured size either to pane A or B.
    if (this.props.sizeB) {
      paneB.addClass('se-pane sm-sized');
      paneB.css(this.getSizedStyle(this.props.sizeB));
      paneA.addClass('se-pane sm-auto-fill');
    } else {
      paneA.addClass('se-pane sm-sized');
      paneA.css(this.getSizedStyle(this.props.sizeA));
      paneB.addClass('se-pane sm-auto-fill');
    }

    el.append(
      paneA,
      paneB
    );
    return el;
  };

  // Accepts % and px units for size property
  this.getSizedStyle = function(size) {
    if (!size || size === 'inherit') return {};
    if (this.props.splitType === 'horizontal') {
      return {'height': size};
    } else {
      return {'width': size};
    }
  };

};

Component.extend(SplitPane);

export default SplitPane;
