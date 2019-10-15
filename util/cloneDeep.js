import { cloneDeepWith } from '../vendor/lodash-es'
import platform from './platform'

export default function cloneDeep (val) {
  return cloneDeepWith(val, value => {
    if (platform.inBrowser && value instanceof window.File) {
      return value
    }
  })
}
