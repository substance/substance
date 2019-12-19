import { isString } from '../util'

const fs = require('fs')

// Note: in contrast to fs.writeFile, this allows to pass a stream as data
export default function writeFile (filePath, data, encoding) {
  return new Promise((resolve, reject) => {
    if (typeof data.pipe === 'function') {
      const file = fs.createWriteStream()
      data.pipe(file)
      file.on('close', () => {
        resolve()
      }).on('error', reject)
    } else {
      if (!isString(data) && !(data instanceof Buffer)) {
        data = Buffer.from(data)
      }
      fs.writeFile(filePath, data, encoding, (err) => {
        if (err) reject(err)
        else resolve()
      })
    }
  })
}
