import { debounce, isString, sendRequest } from '../../util'

const DEFAULT_API_URL = 'http://localhost:4777/api/check'

class SpellCheckManager {

  constructor(editorSession, options) {
    options = options || {}
    let wait = options.wait || 750

    this.editorSession = editorSession
    this.apiURL = options.apiURL || DEFAULT_API_URL

    // TODO: MarkersManager is basically a TextPropertyManager
    this.textPropertyManager = editorSession.markersManager
    this.markersManager = editorSession.markersManager

    this._schedule = {}
    this._scheduleCheck = debounce(this._runSpellCheck.bind(this), wait)

    editorSession.onFinalize('document', this._onDocumentChange, this)
  }

  dispose() {
    this.editorSession.off(this)
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

  _onDocumentChange(change, info) {
    if (info.spellcheck) return
    // Note: instead of analyzing the model, we consider
    // all existing TextPropertyComponents instead
    // as this reflects what is presented to the user
    const textProperties = this.textPropertyManager._textProperties
    Object.keys(change.updated).forEach((pathStr) => {
      if (textProperties[pathStr]) this._scheduleCheck(pathStr)
    })
  }

  _runSpellCheck(pathStr) {
    // console.log('Running spell-checker on', pathStr)
    let path = pathStr.split(',')
    let text = this.editorSession.getDocument().get(path)
    let lang = this.editorSession.getLanguage()
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
    const editorSession = this.editorSession
    const markersManager = editorSession.markersManager
    // NOTE: we have one set of markers for each text property
    // as we analyze each text block one by one
    const key = 'spell-error:'+path.join('.')
    const markers = data.map((m) => {
      return {
        type: 'spell-error',
        start: {
          path: path,
          offset: m.start
        },
        end: {
          offset: m.end
        },
        suggestions: m.suggestions
      }
    })
    markersManager.setMarkers(key, markers)
    editorSession.startFlow()
  }
}

export default SpellCheckManager
