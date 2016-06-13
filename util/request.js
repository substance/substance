'use strict';

module.exports = function request(method, url, data, cb) {
  var request = new XMLHttpRequest();
  request.open(method, url, true);
  request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var res = request.responseText;
      if(isJson(res)) res = JSON.parse(res); 
      cb(null, res);
    } else {
      return cb(new Error('Request failed. Returned status: ' + request.status));
    }
  };

  if (data) {
    request.send(JSON.stringify(data));
  } else {
    request.send();
  }
};

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}