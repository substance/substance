import listDir from './_listDir'
import isDocumentArchive from './_isDocumentArchive'

const fs = require('fs')

// these extensions are considered to have text content
const TEXTISH = ['txt', 'html', 'xml', 'json']

/*
  Provides a list of records found in an archive folder.

  @param {object} opts
    - `noBinaryData`: do not load the content of binary files
    - `ignoreDotFiles`: ignore dot-files
    - versioning: set to true if versioning should be enabled
*/
export default async function readArchive (archiveDir, opts = {}) {
  // make sure that the given path is a dar
  if (await isDocumentArchive(archiveDir, opts)) {
    // first get a list of stats
    const entries = await listDir(archiveDir, opts)
    // then get file records as specified TODO:link
    const resources = {}
    for (var i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const record = await _getFileRecord(entry, opts)
      resources[record.path] = record
    }
    return {
      resources,
      version: '0'
    }
  } else {
    throw new Error(archiveDir + ' is not a valid document archive.')
  }
}

/*
  Provides a record for a file as it is used for the DocumentArchive persistence protocol.

  Binary files can be exluced using `opts.noBinaryData`.

  @example

  ```
  {
    id: 'manuscript.xml',
    encoding: 'utf8',
    data: '<article>....</article>',
    size: 5782,
    createdAt: 123098123098,
    updatedAt: 123234567890,
  }
  ```
*/
async function _getFileRecord (fileEntry, opts) {
  // for text files load content
  // for binaries use a url
  const record = {
    path: fileEntry.name,
    encoding: null,
    size: fileEntry.size,
    createdAt: fileEntry.birthtime.getTime(),
    updatedAt: fileEntry.mtime.getTime()
  }
  if (_isTextFile(fileEntry.name)) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileEntry.path, 'utf8', (err, content) => {
        if (err) return reject(err)
        record.encoding = 'utf8'
        record.data = content
        resolve(record)
      })
    })
  } else {
    // used internally only
    record._binary = true
    if (opts.noBinaryContent) {
      return Promise.resolve(record)
    } else {
      return new Promise((resolve, reject) => {
        fs.readFile(fileEntry.path, 'hex', (err, content) => {
          if (err) return reject(err)
          record.encoding = 'hex'
          record.data = content
          resolve(record)
        })
      })
    }
  }
}

function _isTextFile (f) {
  return new RegExp(`\\.(${TEXTISH.join('|')})$`).exec(f)
}
