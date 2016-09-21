import oo from '../util/oo'

/**
 Default label provider implementation
*/

class LabelProvider {
  constructor(labels, lang) {
    this.lang = lang || 'en'
    this.labels = labels
  }

  getLabel(name) {
    let labels = this.labels[this.lang]
    if (!labels) return name
    return labels[name] || name
  }
}

oo.initClass(LabelProvider)

export default LabelProvider
