class ExternalDropHandler extends DragAndDropHandler {
    match(dragState) {
        return dragState.data
    }

    drop(dragState, context) {
      // Handle filess
      let files = dragState.data.files

      files.forEach((file) => {

      })
      // TODO: handle files

      // Handle Urils

    }
}