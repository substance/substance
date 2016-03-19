"use strict";

var oo = require('../util/oo');
var $ = require('../util/jquery');

/*
  HTTP client for talking with DocumentServer
*/

function DocumentClient(config) {
  this.config = config;
}

DocumentClient.Prototype = function() {

  /*
    A generic request method
  */
  this._request = function(method, url, data, cb) {
    var ajaxOpts = {
      type: method,
      url: url,
      contentType: "application/json; charset=UTF-8",
      dataType: "json",
      success: function(data) {
        cb(null, data);
      },
      error: function(err) {
        // console.error(err);
        cb(new Error(err.responseJSON.errorMessage));
      }
    };
    if (data) {
      ajaxOpts.data = JSON.stringify(data);
    }
    $.ajax(ajaxOpts);
  };

  this.getDocument = function(documentId, cb) {
    this._request('GET', this.config.httpUrl+documentId, null, cb);
  };

};

oo.initClass(DocumentClient);

module.exports = DocumentClient;
