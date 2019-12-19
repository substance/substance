import { Component, $$ } from '../dom'
import { Form, FormRow, Modal, Input, HorizontalStack } from '../ui'

export default class AssetModal extends Component {
  getInitialState () {
    // NOTE: when creating a new file, the file instance is passed as props
    const archive = this.context.api.archive
    const { mode, node, file } = this.props

    let data
    if (mode === 'edit') {
      let asset
      if (node.isInstanceOf('asset')) {
        asset = node
      } else if (node.isInstanceOf('@asset')) {
        asset = archive.getAssetById(node.src)
      } else {
        throw new Error('Incompatible node')
      }
      data = {
        filename: asset.filename || '',
        mimetype: asset.mimetype,
        originalFilename: asset.filename || ''
      }
    } else {
      data = {
        filename: archive.getUniqueFileName(file.name),
        mimetype: file.type,
        size: file.size
      }
    }
    return {
      data,
      duplicateFileError: false
    }
  }

  render () {
    const { data, duplicateFileError } = this.state
    const { mode } = this.props
    const title = mode === 'edit' ? 'Edit File' : 'Add File'
    const confirmLabel = mode === 'edit' ? 'Update File' : 'Create File'
    const modal = $$(Modal, { title, size: 'medium', confirmLabel, class: 'sc-file-modal', disableConfirm: duplicateFileError })
    const form = $$(Form)
    form.append(
      $$(FormRow, { label: 'Filename:' },
        $$(Input, { value: data.filename, autofocus: true, oninput: this._updateFilename }).ref('filename'),
        $$('div', { class: 'se-error' }, duplicateFileError ? 'A file with this name already exists' : null)
      ).addClass('se-src')
    )
    form.append(
      $$(HorizontalStack, {},
        $$('div', { class: 'se-type' }, `type: ${data.mimetype}`),
        data.size
          ? $$('div', { class: 'se-size' }, `size: ${_getFormattedFileSize(data.size)}`)
          : $$('div')
      ).addClass('se-file-info')
    )

    modal.append(form)
    return modal
  }

  _updateFilename () {
    this.state.data.filename = this.refs.filename.val()
    this._validateSrc()
  }

  _validateSrc () {
    const newFilename = this.state.data.filename
    const originalFilename = this.state.data.originalFilename
    if (!originalFilename || newFilename !== originalFilename) {
      const archive = this.context.api.archive
      if (archive.isFilenameUsed(newFilename)) {
        if (!this.state.duplicateFileError) {
          this.extendState({
            duplicateFileError: true
          })
        }
      } else {
        if (this.state.duplicateFileError) {
          this.extendState({
            duplicateFileError: false
          })
        }
      }
    }
  }
}

function _getFormattedFileSize (size) {
  if (size > 1000000) {
    return Math.round(size / 1000000 * 10) / 10 + ' MB'
  } else if (size > 100000) {
    return Math.round(size / 1000) + ' KB'
  } else {
    return size + ' Bytes'
  }
}
