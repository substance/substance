'use strict';

var each = require('lodash/each');
var isArray = require('lodash/isArray');
var last = require('lodash/last');

/*
 * HTML converter for List.
 */
var ListHtmlConverter = {

  type: "list",

  matchElement: function(el) {
    return el.is('ul, ol');
  },

  /*
   *
   * <ol>
   *   <li>Item 1
   *     <ul>
   *       <li>Point A</li>
   *       <li>Point B</li>
   *     </ul>
   *   </li>
   *   <li>Item 2
   *     <ul>
   *       <li>Point C</li>
   *       <li>Point D</li>
   *     </ul>
   *   </li>
   * </ol>
   *
   * Will be modeled as:
   *
   * list:
   *   - list-item[1,o,"Item 1"]
   *   - list-item[2,u,"Point A"]
   *   - list-item[2,u,"Point B"]
   *   - list-item[1,o,"Item 2"]
   *   - list-item[2,u,"Point A"]
   *   - list-item[2,u,"Point B"]
   */
  import: function(el, list, converter) {
    list.items = [];
    // iterate through the children keeping track of the nesting level
    // and associated list type
    var state = {
      level: 0,
      types: [],
      list: list
    };
    this._importList(state, el, converter);
  },

  export: function(node, el, converter) {
    var $$ = converter.$$;
    return this.render(node, {
      createListElement: function(list) {
        var tagName = list.ordered ? 'ol' : 'ul';
        return $$(tagName).attr('data-id', list.id);
      },
      renderListItem: function(item) {
        return $$('li')
          .attr("data-id", item.id)
          .append(converter.annotatedText([item.id, 'content']));
      }
    });
  },

  render: function(list, impl) {
    var children = list.getChildren();
    var el = impl.createListElement(list);

    var j;
    var current = el;
    var stack = [current];
    var level = 1;

    for (var i = 0; i < children.length; i++) {
      var item = children[i];
      if (item.level === level) {
        // nothing to change
      } else if (item.level > level) {
        // push structure
        for (j = level; j < item.level; j++) {
          // create a list element and wrap it into a 'li'
          var listEl = impl.createListElement(item);
          current.append(listEl);
          // update level and stack
          current = listEl;
          stack.push(current);
          level++;
        }
      } else /* if (item.level < level) */ {
        // pop structure
        for (j = level; j > item.level; j--) {
          stack.pop();
          level--;
        }
        current = stack[stack.length-1];
      }
      current.append(impl.renderListItem(item));
    }
    return el;
  },

  _importList: function(state, listEl, converter) {
    var self = this;
    state.level++;
    state.types.push(listEl.tagName);
    each(listEl.children, function(child) {
      var type = child.tagName;
      if (type === "li") {
        self._importListItem(state, child, converter);
      } else if (type == "ol" || type === "ul") {
        self._importList(state, child, converter);
      }
    });
    state.level--;
    state.types.pop();
  },

  _importListItem: function(state, li, converter) {
    var ordered = (last(state.types) === "ol");
    var listItem = converter.convertElement(li);
    listItem.ordered = ordered;
    listItem.level = state.level;
    listItem.parent = state.list.id;
    state.list.items.push(listItem.id);
  },

};

module.exports = ListHtmlConverter;
