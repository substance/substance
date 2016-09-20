import each from 'lodash/each'
import ContainerEditor from './ContainerEditor'

/**
  Represents a flow annotator that manages a sequence of nodes in a container. Needs to
  be instantiated within a ui/Controller context. Works like a {@link ui/ContainerEditor}
  but you can only annotate, not edit.

  @class ContainerAnnotator
  @component
  @extends ui/ContainerEditor

  @prop {String} name unique editor name
  @prop {String} containerId container id
  @prop {ui/SurfaceCommand[]} commands array of command classes to be available

  @example

  ```js
  $$(ContainerAnnotator, {
    name: 'bodySurface',
    containerId: 'main',
    doc: doc,
    commands: [ToggleStrong]
  })
  ```
 */

class ContainerAnnotator extends ContainerEditor {

  render($$) {
    let doc = this.getDocument()
    let containerNode = doc.get(this.props.containerId)

    let el = $$("div")
      .addClass('surface container-node ' + containerNode.id)
      .attr({
        spellCheck: false,
        "data-id": containerNode.id,
        "contenteditable": false
      })

    // node components
    each(containerNode.getNodes(), function(node) {
      el.append(this.renderNode(node))
    }.bind(this))

    return el
  }

}

export default ContainerAnnotator