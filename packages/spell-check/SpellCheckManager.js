import debounce from 'lodash/debounce'
import isString from 'lodash/isString'
import sendRequest from '../../util/sendRequest'

const DEFAULT_API_URL = 'http://localhost:4777/api/check'

class SpellCheckManager {

  constructor(session, options) {
    options = options || {}
    let wait = options.wait || 750

    this.session = session
    this.apiURL = options.apiURL || DEFAULT_API_URL

    // TODO: MarkersManager is basically a TextPropertyManager
    this.textPropertyManager = session.markersManager
    this.markersManager = session.markersManager

    this._schedule = {}
    this._scheduleCheck = debounce(this._runSpellCheck.bind(this), wait)

    session.onFinalize('document', this._onDocumentChange, this)
  }

  dispose() {
    this.session.off(this)
  }

  check(path) {
    this._runSpellCheck(String(path))
  }

  runGlobalCheck() {
    let paths = Object.keys(this.textPropertyManager._textProperties)
    paths.forEach((p) => {
      this._runSpellCheck(p)
    })
  }

  _onDocumentChange(change) {
    // Note: instead of analyzing the model, we consider
    // all existing TextPropertyComponents instead
    // as this reflects what is presented to the user
    const textProperties = this.textPropertyManager._textProperties
    Object.keys(change.updated).forEach((pathStr) => {
      if (textProperties[pathStr]) this._scheduleCheck(pathStr)
    })
  }

  _runSpellCheck(pathStr) {
    let path = pathStr.split(',')
    let text = this.session.getDocument().get(path)
    let lang = this.session.getLanguage()
    if (!text || !isString(text)) return
    sendRequest({
      method: 'POST',
      url: this.apiURL,
      header: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      data: {
        text: text,
        lang: lang
      }
    }).then((data) => {
      data = JSON.parse(data)
      this._addSpellErrors(path, data)
    }).catch(function(err) {
      console.error(err)
    })
  }

  /*
    Called when spell corrections have been returned.

    Removes all spell errors on the given path first.
  */
  _addSpellErrors(path, data) {
    let markers = data.map(function(m) {
      return {
        type: 'spell-error',
        path: path,
        startOffset: m.start,
        endOffset: m.end,
        suggestions: m.suggestions
      }
    })
    this.markersManager.setMarkers(path, 'spell-error', markers)
  }
}

export default SpellCheckManager
