import NodeComponent from './NodeComponent'

export default class SelectableNodeComponent extends NodeComponent {
  didMount () {
    super.didMount()

    const selectableManager = this.context.selectableManager
    if (selectableManager) {
      selectableManager.registerSelectable(this._getSelectableId(), this)
    }
  }

  dispose () {
    super.dispose()

    const selectableManager = this.context.selectableManager
    if (selectableManager) {
      selectableManager.unregisterSelectable(this._getSelectableId(), this)
    }
  }

  setSelected (selected) {
    this.state.selected = selected
    if (selected) {
      this.el.addClass('sm-selected')
    } else {
      this.el.removeClass('sm-selected')
    }
  }

  _getSelectableId () {
    return this.props.node.id
  }
}
