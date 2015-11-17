'use strict';

var extend = require('lodash/object/extend');
var capitalize = require('lodash/string/capitalize');
var SurfaceTool = require('../../ui/SurfaceTool');
var Component = require('../../ui/Component');
var $$ = Component.$$;

var UrlPrompt = Component.extend({
  onSave: function(e) {
    e.preventDefault();
    this.props.tool.createEmbed(this.refs.url.$el.val());
  },

  render: function() {
    var el = $$('div').addClass('se-prompt');
    el.append([
      $$('div').addClass('se-prompt-title').append(this.i18n.t('embed-src')),
      $$('input').attr({type: 'text', placeholder: 'https://vimeo.com/...', value: ''})
                 .ref('url')
                 .on('change', this.onSave)
    ]);
    return el;
  }
});

var EmbedTool = SurfaceTool.extend({
  static: {
    name: 'embed',
    command: 'embed'
  },

  onClick: function() {
    var newState = extend({}, this.state, {showPrompt: !this.state.showPrompt});
    this.setState(newState);
  },

  createEmbed: function(src) {
    var surface = this.getSurface();
    var commandName = this.constructor.static.command;
    var embedResolver = this.context.embedResolver;
    embedResolver(src, function(err, html) {
      surface.executeCommand(commandName, {
        src: src,
        html: html
      });
    });
  },

  render: function() {
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
      var prompt = $$(UrlPrompt, {tool: this});
      el.append(prompt);
    }
    return el;
  }
});

module.exports = EmbedTool;