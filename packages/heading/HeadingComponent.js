import TextBlockComponent from '../../ui/TextBlockComponent'

class HeadingComponent extends TextBlockComponent {
  render($$) {
    let el = super.render.call(this, $$)
    return el.addClass("sc-heading sm-level-"+this.props.node.level)
  }
}

export default HeadingComponent
