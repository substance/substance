'use strict';

var $ = require('../util/jquery');
var oo = require('../util/oo');
var Component = require('./Component');
var $$ = Component.$$;

function Dropdown() {
  Component.apply(this, arguments);
}

Dropdown.Prototype = function() {

  this.getInitialState = function() {
    return {
      open: false
    };
  };

  // Note: It's important that all children tools are rendered (even if not shown)
  // because only that way we can keep the disabled states accurate
  this.render = function() {
    var el = $$('div').addClass('dropdown');
    if (this.state.open) {
      el.addClass('open');
    }
    el.append(
      $$('button').ref('toggle')
        .addClass('toggle')
        .attr('title', this.props.title)
        .append(this.props.label)
        .on('click', this.handleDropdownToggle),
      $$('div').ref('options')
        .addClass('options shadow border fill-white')
        .append(this.props.children)
    );
    return el;
  };

  // Prevent click behavior as we want to preserve the text selection in the doc
  this.handleClick = function(e) {
    e.preventDefault();
  };

  this.handleDropdownToggle = function(e) {
    e.preventDefault();
    var open = this.state.open;
    var self = this;
    if (open) return;
    this.setState({open: !this.state.open});
    setTimeout(function() {
      $(window).one('click', function(e) {
        /*jshint unused: false */
        // e.preventDefault();
        // e.stopPropagation();
        self.close();
      });
    }, 0);
  };

  this.close = function() {
    this.setState({
      open: false
    });
  };
};

oo.inherit(Dropdown, Component);

module.exports = Dropdown;
