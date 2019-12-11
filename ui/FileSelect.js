import { Component, $$, domHelpers } from '../dom'

export default class FileSelect extends Component {
  render () {
    const { multiple, fileType } = this.props
    const el = $$('input', { class: 'sc-file-select', type: 'file' })
      .on('click', domHelpers.stop)
      .on('dblclick', domHelpers.stop)
      .on('change', this._onChange)
    if (fileType) {
      el.setAttribute('accept', fileType)
    }
    if (multiple) {
      el.setAttribute('multiple', true)
    }
    return el
  }

  selectFiles () {
    this.el.val(null)
    return new Promise(resolve => {
      this._resolve = resolve
      this.el.click()
    })
  }

  _onChange (e) {
    domHelpers.stop(e)
    const files = Array.prototype.slice.call(e.currentTarget.files)
    this._resolve(files)
    delete this._resolve
  }
}
