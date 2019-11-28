import { ARABIC_NUMBERS } from './counters'
import CollectionItemLabelManager from './CollectionItemLabelManager'

export default class AffiliationLabelManager extends CollectionItemLabelManager {
  getPath () {
    const doc = this.editorSession.getDocument()
    return [doc.root.id, 'affiliations']
  }

  getItemLabel (item) {
    return ARABIC_NUMBERS[item.getPosition()]
  }

  update () {
    const doc = this.editorSession.getDocument()
    const path = this.getPath()
    const items = doc.resolve(path, true)
    const stateUpdates = items.map(item => {
      const label = this.getItemLabel(item)
      return [item.id, { label }]
    })

    // HACK: also triggering an update of authors
    const authorIds = doc.root.authors || []
    for (const authorId of authorIds) {
      stateUpdates.push([authorId, {}])
    }

    this.editorSession.updateNodeStates(stateUpdates, { silent: true })
  }
}
