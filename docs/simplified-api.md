# Proposal for a simplified editor API

The concept that we have a controller that manages multiple surfaces is hard to grasp sometimes and makes the API more complex than it maybe needs to be. What if we slim down our interface a bit.. and let users interact with editors directly, rather than having having to ask the controller for the currently focused surface.

```js
var BodyEditor = Component.extend({
  didInitialize: function() {
    // Can be any Substance Document compatible instance
    var doc = new Lens.Article().load(EXAMPLE_ARTICLE);

    // Availeble view components by node type name
    var components = {
      "paragraph": require('substance/ui/nodes/paragraph_component'),
      "heading": require('substance/ui/nodes/heading_component')
    };

    // Available commands
    var commands = [
      require('substance/ui/commands/toggle_strong'),
      require('substance/ui/commands/toggle_emphasis')
    ];

    // A set of custom key bindings to extend / override the default ones
    var keybindings = [
      {"keys": ["ctrl+e"], "command": "toggleEmphasis"}
    ];
    
    this.surface = new Surface(this.doc, {
      editor: new ContainerEditor('editor'),
      behaviors: [ListEditing],
      components: components,
      commands: commands,
      keybindings: keybindings
    });

    // Child components depend on a surface compatible instance
    this.childContext = {
      surface: this.surface
    };
  },

  didMount: function() {
    this.bodyEditor.attach(this.refs.bodyContainer);
    // Now we have access to the editing API, so we can tell it to select all content
    this.bodyEditor.executeCommand('selectAll');
  },

  render: function() {
    var el = $$('div').addClass('body-editor-component');

    // Toolbar
    var toolbar = $$(MyToolbar);
    toolbar.ref('toolbar');
    el.append(toolbar);

    // Content Container
    el.append(
      $$(ContainerComponent, {
        containerId: 'body'
      })
      .ref('bodyContainer')
      .attr({ contentEditable: true })
    );
    return el;
  }
  ...
});
```

Now in a full-fledged app we want to embed this editor and also be able to controll it from outside.

```js
var MyApp = Component.extend({
  didMount: function() {
    // Focus the surface
    this.bodyEditor.focus();
    // or this.bodyEditor.setSelection... 
    // this.bodyEditor.executeCommand('deleteSelection');
  },
  render: function() {
    $$(BodyEditor).ref('bodyEditor')
  }
})
```

Why:

- Single interface for editors (no longer hidden behind controller / formally SurfaceManager)
- No confusion anymore about focused surface (each surface is managed by the app directly, and can be focused or unfocused)
- Each command/tool would now operate on surface level (no longer we need dispatching)
- configure different surfaces/editor with different components, keybindings etc.
- no app-scope commands vs. surface-scope commands/keybindings anymore