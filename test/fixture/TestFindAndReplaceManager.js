import { FindAndReplacePackage } from 'substance'

const { FindAndReplaceManager } = FindAndReplacePackage

export default class TestFindAndReplaceManager extends FindAndReplaceManager {
  _getAllAffectedTextPropertiesInOrder () {
    return [
      ['p1', 'content'],
      ['p2', 'content'],
      ['p3', 'content'],
      ['p4', 'content']
    ]
  }
}
