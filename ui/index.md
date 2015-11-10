Provides all UI-related functionality. At the heart there is a Component implementation, which implements reactive rendering engine.

Let's look at a complete example of a simple ProseEditor implementation. The `render` function is the heart of our custom `ProseEditor` component. It contains a bit of custom markup and utilizes predefined UI components, such as a `Toolbar` including tools like the `UndoTool` and a configured `ContainerEditor`, which will do the actual editing work. 

```js
var ProseEditor = Controller.extend({
  // Editor configuration
  static: {
    config: CONFIG,
  },
  // Custom Render method for your editor
  render: function() {
    var config = getConfig();
    return $$('div').addClass('sc-prose-editor').append(
      $$(Toolbar).append(
        $$(Toolbar.Group).append(
          $$(TextTool, {'title': this.i18n.t('switch_text')}),
          $$(UndoTool).append($$(Icon, {icon: "fa-undo"})),
          $$(RedoTool).append($$(Icon, {icon: "fa-repeat"})),
          $$(StrongTool).append($$(Icon, {icon: "fa-bold"})),
          $$(EmphasisTool).append($$(Icon, {icon: "fa-italic"}))
        )
      ),
      $$(ContainerEditor, {
        doc: this.props.doc,
        containerId: 'body',
        name: 'bodyEditor',
        commands: config.bodyEditor.commands
      }).ref('bodyEditor')
    );
  }
});
```

There's also a config object that is essential for the editor to work. The following configuration sets up a component registry that assigns a visual component to each content node type. It also defines which commands should be supported on the controller level (undo, redo, save) and for the editor (strong, emphasis, link). Furthermore we need to setup which text types the editor should support. 

Let's now look at the config object:

```js
var CONFIG = {
  // Controller specific configuration
  controller: {
    // Component registry
    components: {
      'paragraph': require('substance/packages/paragraph/ParagraphComponent'),
      'heading': require('substance/packages/heading/HeadingComponent'),
      'link': require('substance/packages/link/LinkComponent')
    },
    // Controller commands
    commands: [
      require('substance/ui/commands/undo'),
      require('substance/ui/commands/redo'),
      require('substance/ui/commands/save')
    ]
  },
  // Body editor configuration
  bodyEditor: {
    // Surface commands
    commands: [
      require('substance/packages/text/SwitchTextTypeCommand'),
      require('substance/packages/strong/StrongCommand'),
      require('substance/packages/emphasis/EmphasisCommand'),
      require('substance/packages/link/LinkCommand')
    ],
    // Text types available in the switch text type dropdown
    textTypes: [
      {name: 'paragraph', data: {type: 'paragraph'}},
      {name: 'heading1',  data: {type: 'heading', level: 1}},
      {name: 'codeblock', data: {type: 'codeblock'}}
    ]
  }
};
```
