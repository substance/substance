import forEach from './forEach'

export default function sendRequest(params, cb) {
  return new Promise(function(resolve, reject) {
    var method = (params.method || 'GET').toUpperCase()
    var url = params.url
    if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(method) < 0) {
      throw new Error("Parameter 'method' must be 'GET', 'POST', 'PUT', or 'DELETE'.")
    }
    if (!url) {
      throw new Error("Parameter 'url' is required.")
    }
    var xmlhttp = new XMLHttpRequest()
    xmlhttp.onreadystatechange = function() {
      // TODO: we could support more states here to give feedback
      // e.g. about progress of an upload
      if (xmlhttp.readyState === 4) return _done()
    }
    xmlhttp.open(method, url, true)
    if (params.header) {
      forEach(params.header, function(val, key) {
        xmlhttp.setRequestHeader(key, val)
      })
    }
    if (params.data) {
      xmlhttp.send(JSON.stringify(params.data))
    } else {
      xmlhttp.send()
    }

    function _done() {
      if (xmlhttp.status === 200) {
        var response = xmlhttp.responseText
        if (cb) cb(null, response)
        resolve(response)
      } else {
        console.error(xmlhttp.statusText)
        if (cb) cb(xmlhttp.status)
        reject(xmlhttp.statusText, xmlhttp.status)
      }
    }
  })
}

