import Component from '../../ui/Component'

export default class Dropzones extends Component {
  didMount() {
    this.context.dragManager.on('dragstart', this._onDragStart, this)
    this.context.dragManager.on('dragend', this._onDragEnd, this)
  }

  _onDragEnter(e) {
    // console.log('_onDragEnter', e.target)
    e.target.parentNode.classList.add('sm-over')
  }

  _onDragLeave(e) {
    // console.log('_onDragLeave', e.target)
    e.target.parentNode.classList.remove('sm-over')
  }

  render($$) {
    let el = $$('div').addClass('sc-dropzones')
    el.on('dragenter', this._onDrag)
    el.on('dragover', this._onDrag)

    if (this.state.dropzones) {
      this.state.dropzones.forEach((dropzone, index) => {
        let dropType = dropzone.type
        if (dropType === 'place') {
          el.append(
            $$('div').addClass('se-dropzone').attr({
              'data-dropzone-index': index,
            }).css({
              position: 'absolute',
              top: dropzone.top,
              left: dropzone.left,
              width: dropzone.width,
              height: dropzone.height
            }).append(
              $$('div').addClass('se-drop-teaser').css({
                top: dropzone.teaserPos
              }),
              $$('div').addClass('se-drop-shield')
                .on('dragenter', this._onDragEnter)
                .on('dragleave', this._onDragLeave)
                .on('drop', this._onDrop)
            )
          )
        } else if (dropType === 'custom') {
          el.append(
            $$('div').addClass('se-custom-dropzone').attr({
              'data-dropzone-index': index,
            }).css({
              position: 'absolute',
              top: dropzone.top,
              left: dropzone.left,
              width: dropzone.width,
              height: dropzone.height
            }).append(
              // TODO: also provide se-custom-drop-teaser when custom
              // dropzone is provided
              $$('div').addClass('se-message').append(dropzone.message),
              $$('div').addClass('se-drop-shield')
                .on('dragenter', this._onDragEnter)
                .on('dragleave', this._onDragLeave)
                .on('drop', this._onDrop)
            )
          )
        }
      })
    } else {
      el.addClass('sm-hidden')
    }
    return el
  }

  _onDragStart(dragState) {
    setTimeout(() => {
      this.setState({
        dropzones: dragState.dropzones
      })
    })
  }

  _onDragEnd() {
    this.setState({})
  }

  _onDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    let dropzoneIndex = e.target.parentNode.dataset.dropzoneIndex
    let dropzone = this.state.dropzones[dropzoneIndex]
    let dropParams = dropzone.dropParams
    let dropType = dropzone.type
    // Original component (e.g. img element)
    let component = dropzone.component
    let dropzoneComponent = dropzone.dropzoneComponent
    this.context.dragManager.handleDrop(e, {
      dropType,
      dropParams,
      component,
      dropzoneComponent
    })
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

  // just so that the teaser does not prevent dropping
  _onDrag(e) { e.preventDefault() }
}
