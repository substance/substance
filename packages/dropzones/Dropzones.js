import Component from '../../ui/Component'
import forEach from '../../util/forEach'
import getRelativeBoundingRect from '../../util/getRelativeBoundingRect'

export default class Dropzones extends Component {

  didMount() {
    this.context.dragManager.on('drag:started', this.onDragStarted, this)
    this.context.dragManager.on('drag:finished', this.onDragFinished, this)
  }

  render($$) {
    let el = $$('div').addClass('sc-dropzones')

    if (this.state.dropzones) {
      el.on('dragenter', this.onDrag)
        .on('dragover', this.onDrag)

      // Dropzones are scoped by surfaceId
      forEach(this.state.dropzones, (dropzones, surfaceId) => {
        dropzones.forEach((dropzone, index) => {
          let dropType = dropzone.type
          let dropzoneEl
          if (dropType === 'place') {
            dropzoneEl = $$('div').addClass('se-dropzone')
              .attr({
                'data-dropzone-index': index,
                'data-dropzone-surface': surfaceId
              }).append(
                $$('div').addClass('se-drop-teaser').css({
                  top: dropzone.teaserPos
                })
              )
          } else if (dropType === 'custom') {
            dropzoneEl = $$('div').addClass('se-custom-dropzone').attr({
              'data-dropzone-index': index,
              'data-dropzone-surface': surfaceId
            }).append(
              // TODO: also provide se-custom-drop-teaser when custom
              // dropzone is provided
              $$('div').addClass('se-message').append(dropzone.message)
            )
          }
          if (dropzoneEl) {
            let shield = $$('div').addClass('se-drop-shield')
              .on('dragenter', this.onDragEnter)
              .on('dragleave', this.onDragLeave)
              .on('drop', this.onDrop)
              .on('mouseenter', this.onDragEnter)
              .on('mouseleave', this.onDragLeave)
              .on('mouseup', this.onDrop)
            dropzoneEl.append(shield)
            dropzoneEl.css({
              position: 'absolute',
              top: dropzone.top,
              left: dropzone.left,
              width: dropzone.width,
              height: dropzone.height
            })
            el.append(dropzoneEl)
          }
        })
      })
    } else {
      el.addClass('sm-hidden')
    }
    return el
  }

  // triggered by DragManager
  onDragStarted(dragState) {
    let dropzones = this._computeDropzones(dragState)
    setTimeout(() => {
      this.setState({
        dropzones: dropzones
      })
    }, 250)
  }

  // triggered by DragManager
  onDragFinished() {
    this.setState({})
  }

  onDragEnter(e) {
    // console.log('onDragEnter', e.target)
    e.target.parentNode.classList.add('sm-over')
  }

  onDragLeave(e) {
    // console.log('onDragLeave', e.target)
    e.target.parentNode.classList.remove('sm-over')
  }

  // just so that the teaser does not prevent dropping
  onDrag(e) { // eslint-disable-line
    // console.log('onDrag', e.target)
    e.preventDefault()
  }

  onDrop(e) {
    // console.log('Dropzones.onDrop()', e.target)
    // HACK: try if this is really necessary
    e.__reserved__ = true
    e.preventDefault()
    e.stopPropagation()
    let dropzoneIndex = e.target.parentNode.dataset.dropzoneIndex
    let dropzoneSurface = e.target.parentNode.dataset.dropzoneSurface
    let dropzone = this.state.dropzones[dropzoneSurface][dropzoneIndex]
    let dropParams = dropzone.dropParams
    let dropType = dropzone.type
    // Determine target surface
    let targetSurface = this.context.surfaceManager.getSurface(dropzoneSurface)
    // Original component (e.g. img element)
    let component = dropzone.component
    let dropzoneComponent = dropzone.dropzoneComponent
    // HACK: extending the dragState here
    let dragManager = this.context.dragManager
    dragManager.extendDragState({
      targetSurface,
      dropType,
      dropParams,
      component,
      dropzoneComponent
    })
    dragManager._onDragEnd(e)
  }

  /*
    Get bounding rect for a component (relative to scrollPane content element)
  */
  _getBoundingRect(comp) {
    let scrollPane = comp.context.scrollPane
    let contentElement = scrollPane.getContentElement().getNativeElement()
    let rect = getRelativeBoundingRect(comp.getNativeElement(), contentElement)
    return rect
  }

  _computeDropzones(dragState) {
    let scrollPaneName = this.context.scrollPane.getName()
    let surfaces = dragState.scrollPanes[scrollPaneName].surfaces
    let scopedDropzones = {}

    forEach(surfaces, (surface) => {
      let components = surface.childNodes

      // e.g. 3 components = 4 drop zones (1 before, 1 after, 2 in-between)
      let numDropzones = components.length + 1
      let dropzones = []

      for (let i = 0; i < numDropzones; i++) {
        if (i === 0) {
          // First dropzone
          let firstComp = this._getBoundingRect(components[0])
          dropzones.push({
            type: 'place',
            left: firstComp.left,
            top: firstComp.top,
            width: firstComp.width,
            height: firstComp.height / 2,
            teaserPos: 0,
            dropParams: {
              insertPos: i
            }
          })
        } else if (i === numDropzones - 1) {
          // Last dropzone
          let lastComp = this._getBoundingRect(components[i - 1])
          dropzones.push({
            type: 'place',
            left: lastComp.left,
            top: lastComp.top + lastComp.height / 2,
            width: lastComp.width,
            height: lastComp.height / 2,
            teaserPos: lastComp.height / 2,
            dropParams: {
              insertPos: i
            }
          })
        } else {
          // Drop zone in between two components
          let upperComp = this._getBoundingRect(components[i-1])
          let lowerComp = this._getBoundingRect(components[i])
          let topBound = upperComp.top + upperComp.height / 2
          let bottomBound = lowerComp.top + lowerComp.height / 2

          dropzones.push({
            type: 'place',
            left: upperComp.left,
            top: topBound,
            width: upperComp.width,
            height: bottomBound - topBound,
            teaserPos: (upperComp.top + upperComp.height + lowerComp.top) / 2 - topBound,
            dropParams: {
              insertPos: i
            }
          })
        }

        if (i < numDropzones - 1) {
          let comp = components[i]
          // We get the isolated node wrapper and want to use the content element
          if (comp._isIsolatedNodeComponent) {
            comp = comp.getContent()
          }
          // If component has dropzones declared
          if (comp.getDropzoneSpecs) {
            let dropzoneSpecs = comp.getDropzoneSpecs()
            dropzoneSpecs.forEach((dropzoneSpec) => {
              let dropzoneComp = dropzoneSpec.component
              let rect = this._getBoundingRect(dropzoneComp)
              dropzones.push({
                type: 'custom',
                component: comp,
                dropzoneComponent: dropzoneComp,
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                message: dropzoneSpec.message,
                dropParams: dropzoneSpec.dropParams
              })
            })
          }
        }
      }
      scopedDropzones[surface.getName()] = dropzones
    })
    return scopedDropzones
  }

  _renderDropTeaser(hints) {
    if (hints.visible) {
      this.el.removeClass('sm-hidden')
      this.el.css('top', hints.rect.top)
      this.el.css('left', hints.rect.left)
      this.el.css('right', hints.rect.right)
    } else {
      this.el.addClass('sm-hidden')
    }
  }

}
