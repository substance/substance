import { Component } from '../../ui'

/*
  Simple component for realizing grid layouts
*/
class Grid extends Component {
  render($$) {
    let el = $$('div').addClass('sc-grid')
    if (this.props.mobile) {
      el.addClass('sm-mobile')
    }
    el.append(this.props.children)
    return el
  }
}

/*
  A grid row
*/
class Row extends Component {
  render($$) {
    let el = $$('div').addClass('se-row')
    el.append(this.props.children)
    return el
  }
}

/*
  A grid cell
*/
class Cell extends Component {
  render($$) {
    let el = $$('div').addClass('se-cell')
    el.addClass('sm-column-'+this.props.columns)
    el.append(this.props.children)
    return el
  }
}

Grid.Row = Row
Grid.Cell = Cell

export default Grid
