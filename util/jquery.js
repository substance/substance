var inBrowser = (typeof window !== 'undefined');
var $ = null;

if (inBrowser) {
  module.exports = require('jquery');
} else {
  if (!$) {
    var cheerio = require('cheerio');
    $ = cheerio.load('', {decodeEntities: false});
  }
  module.exports = $;
}
