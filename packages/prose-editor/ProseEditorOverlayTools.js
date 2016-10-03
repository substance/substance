import OverlayTools from '../../ui/OverlayTools'

/*
  A default implementation to render the content for the overlay (aka popup) tools.
*/
class ProseEditorOverlayTools extends OverlayTools {

  getToolStyle() {
    return 'outline-dark'
  }

  getClassNames() {
    return 'sc-prose-editor-overlay-tools'
  }

}

export default ProseEditorOverlayTools
