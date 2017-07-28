import ContainerAnnotationCommand from './ContainerAnnotationCommand'
import ContainerAnnotationManager from './ContainerAnnotationManager'

export default {
  name: 'container-annotation',
  configure: function(config) {
    config.addManager('container-annotation', ContainerAnnotationManager)
  },
  ContainerAnnotationCommand,
  ContainerAnnotationManager
}
