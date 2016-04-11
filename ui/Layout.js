var Component = require('./Component');
var $$ = Component.$$;

/**
  Simple layout component for simple layout tasks, without writing CSS.

  @class
  @component

  @prop {String} width 'small', 'medium', 'large' and 'full'
  @prop {String} [type] 'centered', 'left-aligned' or 'right-aligned'
  @prop {String} [noPadding] No padding around layout, will fill the whole space available

  @example

  ```js
  var form = $$(Layout, {
    width: 'large',
    type: 'centered'
  });
  ```
*/
function Layout() {
  Component.apply(this, arguments);
}

Layout.Prototype = function() {

  this.render = function() {
    var el = $$('div').addClass('sc-layout');
    el.addClass('sm-width-'+this.props.width);
    el.addClass('sm-type-'+this.props.type);

    if (this.props.noPadding) {
      el.addClass('sm-no-padding');
    }

    el.append(this.props.children);
    return el;
  };
};

Component.extend(Layout);
module.exports = Layout;