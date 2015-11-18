
module.exports = {

  matchElement: function(el) {
    return el.attr('typeof') === 'meta';
  },

  import: function(el, node, converter) {
    node.id = 'meta';
    var titleEl = el.find('[property=title]');
    if (titleEl) {
      node.title = converter.annotatedText(titleEl, ['meta', 'title']);
    } else {
      node.title = '';
    }
  },

  export: function(node, el, converter) {
    var $$ = converter.$$;
    el.attr('typeof', 'meta');
    el.append($$('h1')
      .attr('property', 'title')
      .append(converter.annotatedText(['meta', 'title']))
    );
  },

};
