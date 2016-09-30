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

export default LabelProvider
