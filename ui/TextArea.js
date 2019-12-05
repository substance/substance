import Input from './Input'

export default class TextArea extends Input {
  _getTagname () {
    return 'textarea'
  }

  _getClass () {
    // Note: adding 'sc-input' to inherit styles
    return 'sc-text-area sc-input'
  }
}
