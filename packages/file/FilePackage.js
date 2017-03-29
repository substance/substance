import { FileNode } from '../../model'

export default {
  name: 'file',
  configure: function(config) {
    config.addNode(FileNode)
  }
}
