import { $$ } from '../dom'
import { platform, getSelectionRect } from '../util'

export default function PopoverMixin (AnnotationComponent) {
  return class AbstractPopover extends AnnotationComponent {
    didMount () {
      super.didMount()

      const editorState = this.context.editorState
      if (editorState) {
        editorState.addObserver(['selectionState'], this._onSelectionStateChange, this, { stage: 'position' })
      }
    }

    dispose () {
      super.dispose()

      const editorState = this.context.editorState
      if (editorState) {
        editorState.removeObserver(this)
      }
    }

    // Get Popover component
    getPopoverComponent () {
      throw new Error('This method is abstract')
    }

    // Check if Popover should be exposed based on selection state
    shouldShowPopover (selectionState) {
      throw new Error('This method is abstract')
    }

    _onSelectionStateChange (selectionState) {
      const oldShowPopup = this._showPopup
      const showPopup = this.shouldShowPopover(selectionState)
      this._showPopup = showPopup
      if (!showPopup && oldShowPopup) {
        this.send('releasePopover', this)
      }
      // always update the request because of positioning
      if (showPopup) {
        const node = this.props.node
        const PopoverComponent = this.getPopoverComponent()
        this.send('requestPopover', {
          requester: this,
          desiredPos: this._getDesiredPopoverPos(),
          content: () => {
            return $$(PopoverComponent, { node })
          },
          position: 'relative'
        })
      }
    }

    _getDesiredPopoverPos () {
      if (platform.inBrowser) {
        const selectionRect = getSelectionRect({ top: 0, left: 0 })
        if (selectionRect) {
          let { left: x, top: y, height, width } = selectionRect
          y = y + height + 5
          x = x + width / 2
          return { x, y }
        }
      }
      return { x: 0, y: 0 }
    }
  }
}
