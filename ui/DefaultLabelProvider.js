/*
 Default label provider implementation
*/
class DefaultLabelProvider {
  constructor(labels, lang) {
    this.lang = lang || 'en'
    this.labels = labels
  }

  getLabel(name) {
    let labels = this.labels[this.lang]
    if (!labels) return name
    return labels[name] || name
  }

  hasLabel(name) {
    let labels = this.labels[this.lang]
    return Boolean(labels[name])
  }
}

export default DefaultLabelProvider
