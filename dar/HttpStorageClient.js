/* global FormData */
import { sendRequest, forEach } from '../util'

export default class HttpStorageClient {
  constructor (apiUrl) {
    this.apiUrl = apiUrl
  }

  /*
    @returns a Promise for a raw archive, i.e. the data for a DocumentArchive.
  */
  read (archiveId, cb) {
    let url = this.apiUrl
    if (archiveId) {
      url = url + '/' + archiveId
    }
    return sendRequest({
      method: 'GET',
      url
    }).then(response => {
      cb(null, JSON.parse(response))
    }).catch(err => {
      cb(err)
    })
  }

  write (archiveId, data, cb) {
    let form = new FormData()
    forEach(data.resources, (record, filePath) => {
      if (record.encoding === 'blob') {
        // removing the blob from the record and submitting it as extra part
        form.append(record.id, record.data, filePath)
        delete record.data
      }
    })
    form.append('_archive', JSON.stringify(data))
    let url = this.apiUrl
    if (archiveId) {
      url = url + '/' + archiveId
    }
    return sendRequest({
      method: 'PUT',
      url,
      data: form
    }).then(response => {
      cb(null, response)
    }).catch(err => {
      cb(err)
    })
  }
}
