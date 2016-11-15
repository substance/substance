import FileNode from './FileNode'

export default {
  name: 'file',
  configure: function(config) {
    config.addNode(FileNode)
  }
}
