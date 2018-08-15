/* eslint-disable no-unused-vars */
import isArray from '../util/isArray'

const ERR_ABSTRACT = 'This method is abstract!'

export default function (DocumentNode) {
  class AbstractList extends DocumentNode {
    createListItem (text) {
      throw new Error(ERR_ABSTRACT)
    }

    getItems () {
      throw new Error(ERR_ABSTRACT)
    }

    getItemsPath () {
      throw new Error(ERR_ABSTRACT)
    }

    insertItemAt (pos, item) {
      throw new Error(ERR_ABSTRACT)
    }

    removeItemAt (pos) {
      throw new Error(ERR_ABSTRACT)
    }

    // general

    getItemAt (idx) {
      return this.getItems()[idx]
    }

    getItemPosition (item) {
      return this.getItems().indexOf(item)
    }

    getLength () {
      return this.getItems().length
    }

    getFirstItem () {
      return this.getItemAt(0)
    }

    getLastItem () {
      return this.getItemAt(this.getLength() - 1)
    }

    appendItem (item) {
      this.insertItemAt(this.items.length, item)
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
      let idx = level - 1
      let listTypes = this._getListTypes()
      return listTypes[idx] || 'bullet'
    }

    setListType (level, listType) {
      let idx = level - 1
      let listTypes = this._getListTypes()
      if (listTypes.length < level) {
        for (let i = 0; i < idx; i++) {
          if (!listTypes[i]) listTypes[i] = 'bullet'
        }
      }
      listTypes[idx] = listType
      this._setListTypes(listTypes)
    }

    _getListTypes () {
      let listTypeString = this.getListTypeString()
      return listTypeString ? listTypeString.split(',').map(s => s.trim()) : []
    }

    _setListTypes (listTypeString) {
      if (isArray(listTypeString)) {
        listTypeString = listTypeString.join(',')
      }
      let oldListTypeString = this.getListTypeString()
      if (oldListTypeString !== listTypeString) {
        this.setListTypeString(listTypeString)
      }
    }

    static isList () {
      return true
    }
  }

  return AbstractList
}
