/*
 Default label provider implementation
*/
class DefaultLabelProvider {
  constructor(labels, lang) {
    this.lang = lang || 'en'
    this.labels = labels
  }

  getLabel(name, context) {
    let labels = this.labels[this.lang]
    if (!labels) return name
    let rawLabel = labels[name] || name
    // If context is provided, resolve templates
    if (context) {
      return this._evalTemplate(rawLabel, context)
    } else {
      return rawLabel
    }
  }

  _evalTemplate(label, context) {
    let vars = this._extractVariables(label)
    vars.forEach((varName) => {
      let searchExp = new RegExp(`\\\${${varName}}`, 'g')
      let replaceStr = context[varName]
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
