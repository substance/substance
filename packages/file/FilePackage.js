import FileNode from '../../model/FileNode'

export default {
  name: 'file',
  configure: function (config) {
    config.addNode(FileNode)
  }
}
