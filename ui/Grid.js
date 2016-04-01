var Component = require('./Component');
var $$ = Component.$$;

/*
  Simple component for realizing grid layouts
*/
function Grid() {
  Component.apply(this, arguments);
}

Grid.Prototype = function() {

  this.render = function() {
    var el = $$('div').addClass('sc-grid');
    if (this.props.mobile) {
      el.addClass('sm-mobile');
    }
    el.append(this.props.children);
    return el;
  };
};

Component.extend(Grid);

/*
  A grid row
*/
function Row() {
  Component.apply(this, arguments);
}

Row.Prototype = function() {

  this.render = function() {
    var el = $$('div').addClass('se-row');
    el.append(this.props.children);
    return el;
  };
};

Component.extend(Row);

/*
  A grid cell
*/
function Cell() {
  Component.apply(this, arguments);
}

Cell.Prototype = function() {

  this.render = function() {
    var el = $$('div').addClass('se-cell');
    el.addClass('sm-column-'+this.props.columns);
    el.append(this.props.children);
    return el;
  };
};

Component.extend(Cell);

Grid.Row = Row;
Grid.Cell = Cell;

module.exports = Grid;