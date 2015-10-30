'use strict';

var oo = require('../util/oo');
var Component = require('./Component');
var $$ = Component.$$;
var $ = require('../util/jquery');

// Toolbar
// ----------------------

function Toolbar() {
  Component.apply(this, arguments);
}

Toolbar.Prototype = function() {
  this.render = function() {
    var el = $$("div").addClass("sc-toolbar");
    el.append(this.props.children);
    return el;
  };
};

oo.inherit(Toolbar, Component);

// Dropdown
// ----------------------

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
    var el = $$('div').addClass('se-toolbar-dropdown');
    if (this.state.open) {
      el.addClass('sm-open');
    }
    el.append(
      $$('button').ref('toggle')
        .addClass('se-toggle')
        .attr('title', this.props.title)
        .append(this.props.label)
        .on('click', this.handleDropdownToggle),
      $$('div').ref('options')
        .addClass('se-options')
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
    var ctx = this;
    if (open) return;
    this.setState({open: !this.state.open});
    setTimeout(function() {
      $(window).one('click', function(e) {
        /*jshint unused: false */
        ctx.close();
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

// Group
// ----------------------

function Group() {
  Component.apply(this, arguments);
}

Group.Prototype = function() {
  this.render = function() {
    var el = $$('div').addClass('se-toolbar-group');
    el.append(this.props.children);
    return el;
  };
};

oo.inherit(Group, Component);


Toolbar.Group = Group;
Toolbar.Dropdown = Dropdown;

module.exports = Toolbar;