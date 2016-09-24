import oo from '../../util/oo'
import EventEmitter from '../../util/EventEmitter'

class FileClientStub {

  uploadFile(file, cb) {
    let delay = 50
    let steps = (file.size / 500000) * (1000 / delay)
    let i = 0
    let channel = new EventEmitter()
    let _step = function() {
      if (i++ < steps) {
        channel.emit('progress', (i-1)/(steps))
        window.setTimeout(_step, delay)
      } else {
        // Default file upload implementation
        // We just return a temporary objectUrl
        let fileUrl = window.URL.createObjectURL(file)
        cb(null, fileUrl)
      }
    }
    _step()
    return channel
  }
}

oo.initClass(FileClientStub)

export default FileClientStub
