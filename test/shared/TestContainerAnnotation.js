import { ContainerAnnotation } from 'substance'

export default class TestContainerAnnotation extends ContainerAnnotation {
  define () {
    return {
      type: 'test-container-anno'
    }
  }
}
