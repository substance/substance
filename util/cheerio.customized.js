import extend from 'lodash/extend'
import cheerio from 'cheerio'
import serialize from 'dom-serializer'

var $ = null

function _createElement(data) {
  var options = {}
  if (data.root && data.root.options) {
    options = data.root.options
  }
  return extend({
    attribs: {},
    children: [],
    parent: null,
    root: null,
    options: options,
    next: null,
    prev: null
  }, data)
}

if (!$) {
  if (cheerio.prototype) {
    cheerio.prototype.prop = cheerio.prototype.attr
    cheerio.prototype.removeProp = cheerio.prototype.removeAttr
    cheerio.prototype.on = function() {}
    cheerio.prototype.off = function() {}
    $ = cheerio.load('', {decodeEntities: false})

    $._createElement = function(tagName, root) {
      return _createElement({
        type: "tag",
        name: tagName,
        root: root
      })
    }

    /*
       we need to be able to create native text nodes efficiently
       this code is taken from:
       https://github.com/cheeriojs/cheerio/blob/106e42a04e38f0d2c7c096d693be2f725c89dc85/lib/api/manipulation.js#L366
    */
    $._createTextNode = function(text, root) {
      return _createElement({
        type: 'text',
        data: text,
        root: root
      })
    }

    var parseMarkup = function(str, options) {
      var parsed = $.load(str, options)
      var root = parsed.root()[0]
      if (!root.options) {
        root.options = options
      }
      return root.children.slice()
    }

    $.parseHTML = function(str) {
      return parseMarkup(str, { xmlMode: false })
    }

    $.parseXML = function(str) {
      return parseMarkup(str, { xmlMode: true })
    }

    $._serialize = function(el) {
      var opts = el.options || (el.root && el.root.options)
      return serialize(el, opts)
    }
  }
}

export default $
