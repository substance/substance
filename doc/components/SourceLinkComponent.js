'use strict';

var Component = require('../../ui/Component');

function SourceLinkComponent() {
  SourceLinkComponent.super.apply(this, arguments);
}

SourceLinkComponent.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var el = $$('a').addClass('sc-source-link')
      .attr({href: '#', target:'_blank', "data-source-file": node.sourceFile, "data-source-line": node.sourceLine})
      .append(node.sourceFile+"#"+node.sourceLine);
    // TODO: make this configurable
    el.attr('href', this.getGithubUrl());
    return el;
  };

  this.getGithubUrl = function() {
    var node = this.props.node;
    var meta = node.getDocument().get('meta');
    var githubUrl = meta.repository + "/blob/" + meta.sha + "/" + node.sourceFile + "#L" + node.sourceLine;
    return githubUrl;
  };
};

Component.extend(SourceLinkComponent);

module.exports = SourceLinkComponent;
