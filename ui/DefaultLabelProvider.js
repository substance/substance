/*
 Default label provider implementation
*/
class DefaultLabelProvider {
  constructor(labels, lang) {
    this.lang = lang || 'en'
    this.labels = labels
  }

  getLabel(name, params) {
    let labels = this.labels[this.lang]
    if (!labels) return name
    let rawLabel = labels[name] || name
    // If context is provided, resolve templates
    if (params) {
      return this._evalTemplate(rawLabel, params)
    } else {
      return rawLabel
    }
  }

  setLanguage(lang) {
    this.lang = lang || 'en'
  }

  _evalTemplate(label, params) {
    let vars = this._extractVariables(label)
    vars.forEach((varName) => {
      let searchExp = new RegExp(`\\\${${varName}}`, 'g')
      let replaceStr = params[varName]
      label = label.replace(searchExp, replaceStr)
    })
    return label
  }

  _extractVariables(rawLabel) {
    let qualityRegex = /\${(\w+)}/g
    let matches
    let vars = []

    while (matches = qualityRegex.exec(rawLabel)) { // eslint-disable-line
      vars.push(matches[1])
    }
    return vars
  }

  hasLabel(name) {
    let labels = this.labels[this.lang]
    return Boolean(labels[name])
  }
}

export default DefaultLabelProvider
