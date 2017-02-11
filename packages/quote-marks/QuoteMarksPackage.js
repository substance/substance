import InsertQuoteMarkCommand from './InsertQuoteMarkCommand'

export default {

  name: 'quote-marks',

  configure: function(config) {
    config.addCommand('insertQuoteMark', InsertQuoteMarkCommand)
    config.addKeyboardShortcut('"', { type: 'textinput', command: 'insertQuoteMark' })
  }

}