'use strict';

var _Promise = require('promise');
var $ = require('../../util/jquery');

var cache = {};

var load = function(url) {
  var promise;
  if (cache.hasOwnProperty(url)) {
    promise = new _Promise(function (resolve) {
      resolve(cache[url]);
    });
  } else {
    promise = new _Promise(function (resolve, reject) {
      $.ajax({
        url: url,
      }).done(function(data) {
        cache[url] = data;
        resolve(data);
      }).error(function(xhr, status, err) {
        reject(404);
      })
    });
  }
  return promise;
};

module.exports = load;
