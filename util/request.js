'use strict';

var $ = require('./jquery');

module.exports = function request(method, url, data, cb) {
  var ajaxOpts = {
    type: method,
    url: url,
    contentType: "application/json; charset=UTF-8",
    // dataType: "json",
    success: function(data) {
      cb(null, data);
    },
    error: function(err) {
      console.error(err);
      cb(err.responseText);
    }
  };

  if (data) {
    ajaxOpts.data = JSON.stringify(data);
  }

  $.ajax(ajaxOpts);
};
