'use strict';

var extend = require('lodash/extend');
var capitalize = require('lodash/capitalize');
var SurfaceTool = require('../../ui/SurfaceTool');
var Component = require('../../ui/Component');

function EmbedTool() {
  EmbedTool.super.apply(this, arguments);
}

EmbedTool.Prototype = function() {

  this.render = function($$) {
    var title = this.props.title || capitalize(this.getName());
    if (this.state.mode) {
      title = [capitalize(this.state.mode), title].join(' ');
    }
    var el = $$('div')
      .addClass('sc-embed-tool se-tool');
    if (this.state.disabled) {
      el.addClass('sm-disabled');
    }

    var button = $$("button")
      .addClass('button')
      .attr('title', title)
      .on('click', this.onClick);
    button.append(this.props.children);

    el.append(button);
    // When we are in edit mode showing the edit prompt
    if (this.state.showPrompt) {
      var prompt = $$(URLPrompt, {tool: this});
      el.append(prompt);
    }

    return el;
  };

  this.createEmbed = function(src) {
    var surface = this.getSurface();
    var commandName = this.constructor.static.command;
    var embedResolver = this.context.embedResolver;
    embedResolver(src, function(err, html) {
      surface.executeCommand(commandName, {
        src: src,
        html: html
      });
    });
  };

  this.onClick = function() {
    var newState = extend({}, this.state, {showPrompt: !this.state.showPrompt});
    this.setState(newState);
  };

};

SurfaceTool.extend(EmbedTool);

EmbedTool.static.name = 'embed';

function URLPrompt() {
  URLPrompt.super.apply(this, arguments);
}

URLPrompt.Prototype = function() {
  this.render = function($$) {
    var el = $$('div').addClass('se-prompt');
    el.append(
      $$('div')
        .addClass('se-prompt-title')
        .append(this.i18n.t('embed-src')),
      $$('input').ref('url')
        .attr({type: 'text', placeholder: 'https://vimeo.com/...', value: ''})
        .on('change', this.onSave)
    );
    return el;
  };

  this.onSave = function(e) {
    e.preventDefault();
    this.props.tool.createEmbed(this.refs.url.val());
  };

};

Component.extend(URLPrompt);

module.exports = EmbedTool;
