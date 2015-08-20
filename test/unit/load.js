var cache = {};

var load = function(url) {
  if (cache[url]) {
    return $.Deferred().resolve(cache[url]);
  } else {
    var promise = $.Deferred()
    $.ajax({
      url: url,
    }).done(function(data) {
      cache[url] = data;
      promise.resolve(data);
    });
    return promise;
  }
};

module.exports = load;