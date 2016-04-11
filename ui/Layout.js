'use strict';

var Component = require('./Component');

function Layout() {
  Component.apply(this, arguments);
}

Layout.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-layout');
    el.addClass('sm-width-'+this.props.width);
    el.addClass('sm-type-'+this.props.type);

    el.append(this.props.children);
    return el;
  };
};

Component.extend(Layout);
module.exports = Layout;