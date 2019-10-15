import { documentHelpers } from '../model'
import { isArray } from '../util'

export default function (DocumentNode) {
  class List extends DocumentNode {
    createListItem (text) {
      return this.getDocument().create({ type: 'list-item', content: text, level: 1 })
    }

    getItems () {
      return documentHelpers.getNodesForIds(this.getDocument(), this.items)
    }

    getItemsPath () {
      return [this.id, 'items']
    }

    getItemAt (idx) {
      const doc = this.getDocument()
      return doc.get(this.items[idx])
    }

    getItemPosition (item) {
      return this.items.indexOf(item.id)
    }

    insertItemAt (pos, item) {
      documentHelpers.insertAt(this.getDocument(), this.getItemsPath(), pos, item.id)
    }

    removeItemAt (pos) {
      documentHelpers.removeAt(this.getDocument(), this.getItemsPath(), pos)
    }

    getLength () {
      return this.items.length
    }

    getListTypeString () {
      return this.listType
    }

    setListTypeString (listTypeStr) {
      this.listType = listTypeStr
    }

    _itemsChanged () {
      // HACK: using a pseudo-change triggered by items when e.g. level changes
      // TODO: find a better way for this.
      this.getDocument().set([this.id, '_itemsChanged'], true)
    }

    getFirstItem () {
      return this.getItemAt(0)
    }

    getLastItem () {
      return this.getItemAt(this.getLength() - 1)
    }

    appendItem (item) {
      this.insertItemAt(this.getLength(), item)
    }

    removeItem (item) {
      const pos = this.getItemPosition(item)
      if (pos >= 0) {
        this.removeItemAt(pos)
      }
    }

    isEmpty () {
      return this.getLength() === 0
    }

    get length () {
      return this.getLength()
    }

    getListType (level) {
      // ATTENTION: level start with 1
      const idx = level - 1
      const listTypes = this._getListTypes()
      return listTypes[idx] || 'bullet'
    }

    setListType (level, listType) {
      const idx = level - 1
      const listTypes = this._getListTypes()
      if (listTypes.length < level) {
        for (let i = 0; i < idx; i++) {
          if (!listTypes[i]) listTypes[i] = 'bullet'
        }
      }
      listTypes[idx] = listType
      this._setListTypes(listTypes)
    }

    _getListTypes () {
      const listTypeString = this.getListTypeString()
      return listTypeString ? listTypeString.split(',').map(s => s.trim()) : []
    }

    _setListTypes (listTypeString) {
      if (isArray(listTypeString)) {
        listTypeString = listTypeString.join(',')
      }
      const oldListTypeString = this.getListTypeString()
      if (oldListTypeString !== listTypeString) {
        this.setListTypeString(listTypeString)
      }
    }

    static isList () {
      return true
    }
  }
  return List
}
