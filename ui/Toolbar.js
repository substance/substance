'use strict';

var Component = require('./Component');
var $$ = Component.$$;
var DefaultDOMElement = require('./DefaultDOMElement');

/**
  A simple container holding editing tools.
  
  @class
  @component

  @example
  
  ```js
  $$(Toolbar).append(
    $$(Toolbar.Group).append(
      $$(UndoTool).append($$(Icon, {icon: 'fa-undo'}))
    )
  )
  ```
*/

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

Component.extend(Toolbar);

/**
  @class Toolbar.Dropdown
  @component
  
  @prop {ui/VirtualDOMElement} name unique editor name
  @example
  
  ```
  $$(Toolbar.Dropdown, {label: $$(Icon, {icon: 'fa-image'}),}).append(
    $$(InsertFigureTool).append(this.i18n.t('insert'))
  )
  ```
*/

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
    if (open) return;
    this.setState({open: !this.state.open});
    // TODO: why do we need to do this delayed?
    setTimeout(function() {
      var windowEl = DefaultDOMElement.wrapNativeElement(window);
      windowEl.on('click', this.close, this, { once: true });
    }, 0);
  };

  this.close = function() {
    this.setState({
      open: false
    });
  };
};

Component.extend(Dropdown);

/**
  @class Toolbar.Group
  @component

  @prop {ui/VirtualDOMElement} name unique editor name

  @example
    
  ```js
  $$(Toolbar.Group).append(
    $$(StrongTool).append($$(Icon, {icon: 'fa-bold'}))
  )
  ```
*/

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

Component.extend(Group);


Toolbar.Group = Group;
Toolbar.Dropdown = Dropdown;

module.exports = Toolbar;