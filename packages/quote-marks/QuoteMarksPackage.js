import InsertQuoteMarkCommand from './InsertQuoteMarkCommand'

export default {

  name: 'quote-marks',

  configure: function (config) {
    config.addCommand('insert-quote-marks', InsertQuoteMarkCommand, {
      commandGroup: 'text-macros'
    })
    config.addKeyboardShortcut('"', { type: 'textinput', command: 'insert-quote-marks' })
  }

}
