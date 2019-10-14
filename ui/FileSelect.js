import { Component, $$, domHelpers } from '../dom'

export default class FileSelect extends Component {
  render () {
    const { multiple, fileType } = this.props
    const el = $$('input', { class: 'sc-file-select', type: 'file' })
      .on('click', domHelpers.stop)
    el.attr({
      accept: fileType,
      multiple
    })
    return el
  }

  selectFiles () {
    this.el.val(null)
    return new Promise((resolve) => {
      this.el.addEventListener('change', (e) => {
        const files = Array.prototype.slice.call(e.currentTarget.files)
        resolve(files)
        // TODO: is it possible that this fails?
      }, this, { once: true })
      this.el.click()
    })
  }
}
