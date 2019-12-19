import DocumentNode from './DocumentNode'

export default class AssetNode extends DocumentNode {
  define () {
    return {
      type: '@asset',
      // ATTENTION: internally this is used for a DAR assetId, not as file name.
      // During conversion it is mapped to the filename registered in the DAR.
      src: 'string',
      // TODO: can we really provide this?
      // it would be rather read-only
      mimetype: 'string'
    }
  }
}
