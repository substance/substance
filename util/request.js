/**
  Performs an asynchronous HTTP request.

  @param {String} method HTTP method to use for the request
  @param {String} url url to which the request is sent
  @param {Object} data json to be sent to the server
  @param {Function} cb callback that takes error and response data

  @example

  ```js
  request('GET', './data.json', null, function(err, data) {
    if (err) return cb(err);
    cb(null, data);
  });
  ```
*/
export default function request(method, url, data, cb) {
  var request = new XMLHttpRequest()
  request.open(method, url, true)
  request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var res = request.responseText
      if(isJson(res)) res = JSON.parse(res)
      cb(null, res)
    } else {
      return cb(new Error('Request failed. Returned status: ' + request.status))
    }
  }

  if (data) {
    request.send(JSON.stringify(data))
  } else {
    request.send()
  }
}

function isJson(str) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}