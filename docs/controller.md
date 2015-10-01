# Class UI.Controller 

```js
var Controller = require('substance/ui/controller');
```

The Substance Controller interface is central for building editors. It is the top level glueing piece that connects your app with the Substance editing infrastructure.

## Construction

In order to construct a controller, you need to have a document instance ready, as well as a set of components and commands that you want your app to support. We illustrate this by setting up a controller instance within the initialization phase of a custom editor component.

```js
var MyEditor = Component.extend({  
  didInitialize: function() {
    // Can be any Substance Document compatible instance
    var doc = new Substance.Article().loadHtml('<p>Hello world</p>');

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

    var ctrl = new Controller(this.doc, {
      components: components,
      commands: commands
    });

    // Make your controller available to all child components of your editor
    this.childContext = {
      controller: this.controller
    };
  },
  ...
});
```

A controller can manage one or more editing surfaces. We will create a surface for editing the body container of our HTML document. In the view component that hosts the surface, we must attach the surface once the dom is in place.

```js
var BodyNodes = Component.extend({
  didInitialize: function() {
    var ctrl = this.context.controller;
    // Construct a container editor instance
    var bodyEditor = new ContainerEditor('body');
    var bodySurface = ctrl.createSurface(bodyEditor, {name: 'body'});
  },
  didMount: function() {
    this.props.doc.connect(this, {
      'document:changed': this.onDocumentChange
    });
    this.surface.attach(this.$el[0]);
  }
});
```

## API

The controller is the interface for your app to trigger editor actions. For instance from any component, not only from a predefined toolbar commands can be executed on the controller to update the document.

**createSurface**(editor:Editor, options: object) → UI.Surface

Create new Surface instance, registered at the controller.

**getSurface**([name:string]) → UI.Surface

When called without a parameter returns the currently focused surface. When `name` provided the Surface registered with that name is returned.

**getComponent**(name:string) → UI.Component

Returns the component class registered for the given `name`. From ContainerNodeComponent:

```js
var ComponentClass = ctrl.getComponent(node.type);
return $$(ComponentClass, {
  doc: doc,
  node: node
}).ref(node.id);
```

**getSelection**([surfaceName]) → Document.Selection

Get selection for the currently focused surface or `null` if there is no focused surface. When `surfaceName` given the selection of the addressed surface is returned.

**getCommand**(name) → UI.Command

Gets a command by name from the command registry. From `AnnotationTool`:

```js
var command = this.getCommand();
var annos = command.getAnnotationsForSelection();

...

if (command.isDisabled(annos, sel)) {
  newState.disabled = true;
} else if (command.canCreate(annos, sel)) {
  newState.mode = "create";
}
...
```

**executeCommand**(commandName) → info:Object

Execute a command that in most cases triggers a document transformation and corresponding UI updates. For instance when pressing `ctrl+b` the `toggleStrong` command is executed. Each implemented command returns a custom info object, describing the action that has been performed. After execution a `command:executed` event is emitted on the controller. See Events section.

```js
ctrl.executeCommand('toggleStrong');
// => {mode: 'create', anno: Object}
```


## Events

Emits events related to the app lifecycle.

**command:executed**(info: Object) 

Emitted after a command has been executed. Since we did not allow command implementations to access UI components, your UI components can listen to the `command:executed` event and perform necessary action then. 

In the LinkTool we toggle the edit link prompt, after creation or when in the edit mode (toggleLink is executed while an existing annotation contains the current selection).

```js
LinkTool.Prototype = function() {
  this.didInitialize = function() {
    var ctrl = this.getController();

    ctrl.connect(this, {
      'command:executed': this.onCommandExecuted
    });
  };
  
  this.onCommandExecuted = function(info, commandName) {
    if (commandName === this.static.command) {
      // Toggle the edit prompt when either edit is requested or a new link has been created
      if (_.includes(['edit','create'], info.mode)) {
        this.togglePrompt();
      }
    }
  };
  ...
};
```

**selection:changed**(sel:Selection, surface:Surface)

Emitted when the active selection has changed, e.g. through cursor movement. Transports `sel` a Document.Selection that can be expected but also the surface in which the selection change happened.

**document:saved**(doc:Document)

When a save workflow has been completed successfully.