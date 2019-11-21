/*
  Default label provider implementation
*/
export default class DefaultLabelProvider {
  constructor (labels, lang) {
    this.lang = lang || 'en'
    this.labels = labels
  }

  getLabel (name, params) {
    const labels = this.labels[this.lang]
    if (!labels) return name
    const rawLabel = labels[name] || name
    // If context is provided, resolve templates
    if (params) {
      return this._evalTemplate(rawLabel, params)
    } else {
      return rawLabel
    }
  }

  setLanguage (lang) {
    this.lang = lang || 'en'
  }

  _evalTemplate (label, params) {
    const vars = this._extractVariables(label)
    vars.forEach((varName) => {
      const searchExp = new RegExp(`\\\${${varName}}`, 'g')
      const replaceStr = params[varName]
      label = label.replace(searchExp, replaceStr)
    })
    return label
  }

  _extractVariables (rawLabel) {
    const qualityRegex = /\${(\w+)}/g
    let matches
    const vars = []
    while (matches = qualityRegex.exec(rawLabel)) { // eslint-disable-line
      vars.push(matches[1])
    }
    return vars
  }
}
