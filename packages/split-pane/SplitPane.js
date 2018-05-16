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

class SplitPane extends Component {
  render ($$) {
    if (this.props.children.length !== 2) {
      throw new Error('SplitPane only works with exactly two child elements')
    }

    let el = $$('div').addClass('sc-split-pane')
    if (this.props.splitType === 'horizontal') {
      el.addClass('sm-horizontal')
    } else {
      el.addClass('sm-vertical')
    }

    let paneA = this.props.children[0]
    let paneB = this.props.children[1]

    // Apply configured size either to pane A or B.
    if (this.props.sizeB) {
      paneB.addClass('se-pane sm-sized')
      paneB.css(this.getSizedStyle(this.props.sizeB))
      paneA.addClass('se-pane sm-auto-fill')
    } else {
      paneA.addClass('se-pane sm-sized')
      paneA.css(this.getSizedStyle(this.props.sizeA))
      paneB.addClass('se-pane sm-auto-fill')
    }

    el.append(
      paneA,
      paneB
    )
    return el
  }

  // Accepts % and px units for size property
  getSizedStyle (size) {
    if (!size || size === 'inherit') return {}
    if (this.props.splitType === 'horizontal') {
      return {'height': size}
    } else {
      return {'width': size}
    }
  }
}

export default SplitPane
