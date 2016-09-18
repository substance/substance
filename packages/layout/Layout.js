'use strict';

import Component from '../../ui/Component'

/**
  Layout component for simple layout tasks, without having to write CSS

  @class
  @component

  @prop {String} width 'small', 'medium', 'large' and 'full'
  @prop {String} [textAlign] 'center', 'left' or 'right'
  @prop {String} [noPadding] No padding around layout, will fill the whole space

  @example

  ```js
  var form = $$(Layout, {
    width: 'large',
    textAlign: 'center'
  });
  ```
*/
function Layout() {
  Component.apply(this, arguments);
}

Layout.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-layout');
    el.addClass('sm-width-'+this.props.width);
    if (this.props.textAlign) {
      el.addClass('sm-text-align-'+this.props.textAlign);
    }

    if (this.props.noPadding) {
      el.addClass('sm-no-padding');
    }

    el.append(this.props.children);
    return el;
  };
};

Component.extend(Layout);
export default Layout;