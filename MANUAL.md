# Substance Developer's Manual

Substance is a __library__ for creating web-based content editors. As opposed to other existing web editors, Substance is __not__ just __a widget__ you include into your web-application. It is designed to build advanced word processors (comparable to Google Docs) from scratch.

The unique point of Substance is __Customizability__. You can __customize everything__, starting from the content model, to the rendering, to the toolbars and overlays or keyboard shortcuts.

This document explains the major concepts of Substance and help you get started with development.

* [Quick Start](#quick-start)
* [Document Model](#document-model)
* [Converters](#converters)
* [Configurator and Substance Packages](#configurator-and-substance-packages)
* [Components](#components)
* [Editor Session](#editor-session)
* [Commands](#commands)
* [Keyboard Shortcuts](#keyboard-shortcuts)
* [Setting up an Editor](#setting-up-an-editor)
* [Toolbars and Overlays](#toolbars-and-overlays)

*Please note, that not all features are documented in full detail. We are working on complete API docs for version 2.0. Until then, please look at the [comments in the source code](https://github.com/substance/substance/blob/master/ui/Component.js#L7) for a full API reference.*


## Quick Start

Install and run the `example-editor` application to try out Substance.

```bash
$ git clone https://github.com/substance/example-editor.git
```

```bash
$ npm install
$ npm start
```

While you are reading this manual, look for the described concepts in the `example-editor` code.

## Document Model

It begins with the data. In Substance you __define a schema__, containing a set of Node descriptions for paragraphs, headings, etc.

```js
class Heading extends TextBlock {}

Heading.schema = {
  type: "heading",
  level: { type: "number", default: 1 }
}
```

### Node Classes

When you add support for a new element, you have to choose a Substance node type. Use this check list to find out what kind of element it is.

#### TextBlock

- Does the element contain annotated text?
- Is it part of a container? (can be moved around)

Example elements: `<paragraph>`, `<heading>`

#### PropertyAnnotation

- Is the element used for formatting, highlighting?
- Can the cursor move inside the element, changing its text?

Example elements: `<strong>`, `<emphasis>`, `<hyperlink>`

#### InlineNode

- Does the element behave like a single text character in the text flow?
- Is the element content generated (e.g. a label)?
- Is the element content a graphic?
- Is the content of the node immutable to text editing and can only be deleted as a whole?

Example elements: `<xref>`

#### Container

- Does the element define a sequence of nodes?
- Can the order of the nodes be changed by the user?

Example elements: `<body>`

#### DocumentNode

- Does your element not fit into any of the previous types?
- Is your element a block image?
- Is your element a table?

Example elements: `<figure>`, `<table>`

### Define a schema

```js
let schema =  new DocumentSchema({
  name: 'example-article',
  DocumentClass: Document,
  defaultTextType: 'paragraph'
})
schema.addNodes([Title, Body, Paragraph])
```

### Create an empty document instance

```js
let doc = new Document(schema)
```

Next we want to populate the document with content. There are different ways to do it, but the recommended way is writing converters.

## Converters

Substance is designed to work with XML as a data representation format. This gives you the opportunity to model a completely custom content model for your documents. Let's assume the following simple XML document.

```xml
<example-article>
  <title>Hello Substance</title>
  <body>
    <paragraph>Hello <emphasis>Substance</emphasis></paragraph>
    <figure image-source="figure1.png">
      <title>Figure 1</title>
      <caption>Lorem ipsum</caption>
    </figure>
  </body>
</example-article>
```

We need to provide converters for all elements (title, body, paragraph, figure, caption). A converter simply converts from DOM elements to Substance Nodes, which are regular Javascript objects.

The following code shows the converter for the figure node type.

```js
export default {
  type: 'figure',
  tagName: 'figure',

  import: function(el, node, converter) {
    var title = el.find('title')
    var caption = el.find('caption')
    node.imageSource = el.attr('image-source')
    node.title = converter.convertElement(title).id
    node.caption = converter.convertElement(caption).id
  },

  export: function(node, el, converter) {
    el.attr('image-source', node.imageSource)
    el.append(converter.convertNode(node.title))
    el.append(converter.convertNode(node.caption))
  }
}
```

And here's a converter that reads the `<title>` element and turns it into a title node.

```js
export default {

  type: 'title',
  tagName: 'title',

  import: function(el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'])
  },

  export: function(node, el, converter) {
    el.append(converter.annotatedText([node.id, 'content']))
  }

}
```

And here's a converter that just maps the emphasis element to an emphasis node. No data is carries, so there is no need to implement import and export functions.

```js
export default {
  type: 'emphasis',
  tagName: 'emphasis'
}
```

To import the above XML snippet we also need converters for `<exaple-article>`, `<body>` and `<paragraph>`. To put it all together we create an instance of XMLImporter and provide schema plus converters.


```js
let importer = new XMLImporter({
  schema: schema,
  converters: [
    SimpleArticleConverter,
    TitleConverter,
    BodyConverter,
    ParagraphConverter,
    FigureConverter
  ]
})

let doc = importer.importDocument(xmlString)
```

## Configurator and Substance Packages

Substance editors are configured using a simple `Configurator` API. For instance you can define what node types are available or which converters should be used.

```js
let configurator = new Configurator()
configurator.addNode(Figure)
configurator.addNode(Paragraph)
configurator.addNode(Title)
configurator.addConverter('xml', TitleConverter)
configurator.addConverter('xml', ParagraphConverter)
configurator.addConverter('xml', FigureConverter)
```

The Configurator API also helps us with registering the schema. Note, that we did this manually (`new DocumentSchema()`) in the Document Model section.

```js
configurator.defineSchema({
  name: 'example-article',
  DocumentClass: Document,
  defaultTextType: 'paragraph'
})
```

Now we are able to create an empty doc by utilizing the configurator.

```js
let emptyDoc = configurator.createDocument()
```

The configurator also helps us creating an importer instance.

```js
configurator.addImporter('xml', XMLImporter)
let xmlImporter = cfg.createImporter('xml')
let doc = xmlImporter.importDocument(xmlString)
```

You can make your editor extensible by defining packages, which can then be imported by the configurator API. Here's an example `FigurePackage.js`:

```js
export default {
  name: 'figure',
  configure: function(config) {
    config.addNode(Figure)
    config.addConverter('xml', FigureConverter)
  }
}
```

And here's how it is imported:

```js
let configurator = new Configurator()
configurator.import(FigurePackage)
```

## Components

Substance uses a light-weight component implementation inspired by [React](https://facebook.github.io/react/). In contrast to React, we use synchronous rendering and a more minimalistic life-cycle. It also provides *up-tree* communication and *dependency injection*. Otherwise the idea is pretty much the same, so it may also be a good idea to look at the React documentation for better understanding the underlying concepts.

Here's how you can define a simple Component:

```js
class HelloMessage extends Component {
  render($$) {
    return $$('div').append(
      'Hello ',
      this.props.name
    )
  }
}
```

And mount it to a DOM Element:

```js
HelloMessage.mount({name: 'John'}, document.body)
```

Note that every component must implement a render method that returns a virtual element. The argument `$$` is a function used to construct elements. Elements can be regular HTML elements (`<div>`, `<span>` etc.) or components (`HelloMessage`). Here's an example of an `App` component that creates a `HelloMessage` element.


```js
class App extends Component {
  render($$) {
    return $$('div').append(
      $$(HelloMessage, {name: 'John'})
    )
  }
}
```

Now we can mount the App component instead.

```js
App.mount(document.body)
```

### Props

`props` are provided by a parent component.  An initial set of properties is provided
via constructor. After that, the parent component can call `setProps` or `extendProps`
to update these properties which triggers rerendering if the properties change.

### State

`state` is a set of flags and values which are used to control how the component
gets rendered given the current props. Using `setState` the component can change
its internal state, which leads to a rerendering if the state changes.
Prefer using `extendState` rather than `setState`.

Normally, a component maintains its own state. It isn't recommended that a
parent pass in or update state. If you find the need for this, you should be
looking at `props`.

State would be useful in situations where the component itself controls some
aspect of rendering. Eg. whether a dropdown is open or not could be a state
within the dropdown component itself since no other component needs to know
it.

### Refs

A child component with a `ref` id will be reused on rerender. All others will be
wiped and rerender from scratch. If you want to preserve a grand-child (or lower), then
make sure that all anchestors have a ref id. After rendering the child will be
accessible via `this.refs[ref]`.

### Component lifecycle

- `didMount` is called when the element is inserted into the DOM. Typically, you can use this to set up subscriptions to changes in the document or in a node of your interest. Remember to unsubscribe from all changes in the `dispose` method otherwise listeners you have attached may be called without a context.

  ```js
  class MyComponent extends Component {
    didMount() {
      this.context.editorSession.onRender('document', this.rerender, this, {
        path: [this.props.node.id, 'label']
      })
    }

    dispose() {
      this.context.editorSession.off(this)
    }
  }
  ```

- `didUpdate` is called after state or props have been updated and the implied rerender is completed.

- `dispose` is called when the component is unmounted, i.e. removed from DOM, hence disposed. Remember to unsubscribe all change listeners here.

- `willReceiveProps` is called before properties are updated. Use this to dispose objects which will be replaced when properties change.
For example you can use this to derive state from props.

- `willUpdateState` is called before the state is changed

### Actions

A component can send actions via `send` which are bubbled up through all parent
components until one handles it.

```js
  class ChildComponent extends Component {
    render($$) {
      return $$('div').append(
        $$('button').append('Send hello')
          .on('click', this._sendMessage)
      )
    }

    _sendMessage() {
      this.send('message', 'Hello')
    }
  }
```

A component declares that it can handle an action by calling the `handleActions` method on itself in the constructor or
the `didMount` lifecycle hook.

```js
class GrandParentComponent Component {
  didMount() {
    this.handleActions('message', this._handleMessage)
  }

  _handleMessage(message) {
    console.info('Message Received:', message)
  }
  ...
}
```

## Dependency Injection

We provide a dependency injection mechanism. This allows allows passing down information to all child components. Use dependency injection with care, you don't want your components to depend on a whole lot of infrastructure.

You can use it like so:

```js
class A extends Component {
  getChildContext() {
    editorSession: this.props.editorSession
  }

  render($$) {
    return $$(B)
  }
}

class B extends Component {
  render($$) {
    // this.context.editorSession is available here
  }
}
```

Keep in mind you should never provide mutable data via dependency injection. Pass only references to objects that don't change during the life time of the parent component that introduced the child context.

## EditorSession

The `EditorSession` is the heart of your editor. It provides an interface for manipulating documents in a transactional way and allows to subscribe to a number of events. For instance you can get notified when the user changed the selection, or made a change to the document. On construction it takes a `document` and a `configurator`.

```js
let editorSession = new EditorSession(doc, {
  configurator: config
})
```

### Selection

The EditorSession maintains a user selection, which you can always query like so:

```js
let sel = editorSession.getSelection()
```

There are two types of text selections:

- `PropertySelection` is bound to a text property, e.g. when you select text inside a paragraph or heading. You can create it programmatically like so.

  ```js
  let propSel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 6
  })
  ```

- `ContainerSelection` can span over multiple paragraphs, it is always related to a container (e.g. `<body>`)

  ```js
  sel = editorSession.createSelection({
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 0,
    endPath: ['p3', 'content'],
    endOffset: 6,
    containerPath: 'body',
    surfaceId: 'body'
  })
  ```

### Transactions

All document manipulation must be done through a transaction. This ensures that a change is an atomic operation, that can be undone and redone. To create a heading at the current selection in Substance you can do this.

```js
editorSession.transaction((tx) => {
  let node = tx.insertBlockNode({
    type: 'heading',
    level: 1
  })
  tx.setSelection({
    type: 'property',
    path: node.getPath(),
    startOffset: 0
  })
})
```

First we create a block node at the current selection, then we set the selection to the start of that new heading node.

### Update Stages and Resources

When the editor session is updated it goes through different update stages. You can also subscribe to a resource (e.g. the document or the selection)

Stages:

- `update` - fired immediately after a model change
- `pre-render` -  can be used collect information before rendering
- `render` - during rendering
- `post-render` - after rendering, can be used to collect visual data for positioning
- `position` - use this stage for positioning (e.g. the overlay is positioned here)
- `finalize` - use this for cleanup if needed

Resources:

- `document` - document changes
- `selection` - whenever the selection has been updated
- `commandStates` - whenever the commandStates have been changed

For instance you can listen to document changes in your components.

```js
class ImageComponent extends NodeComponent {

  didMount() {
    super.didMount.call(this)
    this.context.editorSession.onRender('document', this._onDocumentChange, this)
  }

  dispose() {
    super.dispose.call(this)
    this.context.editorSession.off(this)
  }

  _onDocumentChange(change) {
    if (change.hasUpdated(this.props.node.id) ||
      change.hasUpdated(this.props.node.imageFile)) {
      this.rerender()
    }
  }
}
```

## Commands

In Substance you can define Command classes for each action you want to run on the document. For instance you want to register commands for toggling annotations (`strong`, `emphasis`, `hyperlink`) or creating a new block node (e.g. a `figure` or a table). The interface looks like this.

```js
class MyCommand extends Command {
  getCommandState(params, context) {
    // determine commandState based on params and context
  }

  execute(params, context) {
    // perform operations on the document
  }
}
```

Commands need to be registered using the configurator before they can take effect.

```js
config.addCommand('heading1', SwitchTextTypeCommand, {
  spec: { type: 'heading', level: 1 },
  commandGroup: 'text-types'
})
```

### Keyboard Shortcuts

```js
config.addKeyboardShortcut('CommandOrControl+Alt+1', { command: 'heading1' })
```

## Setting up an Editor

- describe how to implement editor based on AbstractEditor
- how to run it

## Toolbars and Overlays

```js
config.addToolPanel('toolbar', [
  {
    name: 'text-types',
    type: 'tool-dropdown',
    showDisabled: false,
    style: 'descriptive',
    commandGroups: ['text-types']
  },
  {
    name: 'annotations',
    type: 'tool-group',
    showDisabled: true,
    style: 'minimal',
    commandGroups: ['annotations']
  }
])
```

- how to configure tool panels
- how to attach a toolbar / overlay
