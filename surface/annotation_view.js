'use strict';

var NodeView = require('./node_view');

var AnnotationView = NodeView.extend({
  name: "annotation",
  tagName: 'span',

  getClassNames: function() {
    var classNames = this.node.getClassNames();
    if (this.props.classNames) {
      classNames += " " + this.props.classNames.join(' ');
    }
    return classNames.replace(/_/g, '-');
  }
});

module.exports = AnnotationView;
