# Substance - 

Substance is a A JavaScript library for web-based content editing. It enables you to build custom web-based editors. See it in action:

- **[Substance HTML Editor](http://cdn.substance.io/html-editor)** - A minimal HTML editor component based on Substance
- **[Lens Writer](http://cdn.substance.io/lens-writer)** - A full-fledged scientific editor

<!--
- **[Archivist Writer](http://cdn.substance.io/archivist-composer)** - A modern interface for tagging entities and subjects in digital archives
-->

## Motivation

Building a web editor is a hard task. Native browser support for text editing is [limited and not reliable](https://medium.com/medium-eng/why-contenteditable-is-terrible-122d8a40e480) and there are many pitfalls such as handling selections, copy&paste or undo/redo. Substance was developed to solve the common problems of web-editing and provides API's for building custom editors.

With Substance you can:

- Define a *custom article schema*
- Manipulate content and annotations using *operations* and *transactions*
- Define a custom HTML structure and attach a `Substance Surface` on it to make it editable
- Implement custom tools for any possible task like toggling annotations, inserting content or replacing text
- Control *undo/redo* behavior and *copy&paste*
- and more.

## Getting started

We provide a ready to use [HTML Editor](https://github.com/substance/html-editor) component. It can be injected easily into an existing web application. 

```js
var htmlEditor = Substance.HtmlEditor.init($('#editor_container'), {
  content: '<p>Hello <strong>world</strong></p><p>Some <em>emphasized</em> text</p>'
});
```

HtmlEditor takes HTML as an input and lets you access to edited content at any time.

```js
htmlEditor.getContent();
```

Behind the curtains, your document is converted to a Javascript document model, that guarantees you a reliable and sideffect-free editing experience. You have access to this data as well.

```js
htmlEditor.getDocument();
```

You may likely want to customize that editor a bit. For instance you want to restrict the supported content types and customize the toolbar accordingly. This is all possible by [patching your very own HtmlEditor](https://github.com/substance/html-editor).


## Defining custom article formats.

Substance allows you to define completely custom article formats. 

```js
var Paragraph = Substance.Document.Paragraph;
var Emphasis = Substance.Document.Emphasis;
var Strong = Substance.Document.Strong;

var Highlight = Document.ContainerAnnotation.extend({
  name: 'highlight',
  properties: {
    created_at: 'date'
  }
});

var schema = new Document.Schema("my-article", "1.0.0");
schema.getDefaultTextType = function() {
  return "paragraph";
};
schema.addNodes([Paragraph, Emphasis, Strong, Highlight]);
```

A very simple complete example is the [HtmlArticle](/ui/html-editor/html_article.js) specification used by HtmlEditor. Lens Writer defines a [scientific article](https://github.com/substance/lens-writer/tree/master/lib/article) including bib items and figures with captions etc.


## Manipulate documents programmatically

Substance documents can be manipulated incrementally using simple operations. Let's grab an existing article implementation and create instances for it.

```js
var doc = new RichTextArticle();
```

When you want to update a document, you should wrap your changes in a transaction, so you don't end up in inconsistent in-between states. The API is fairly easy. Let's create several paragraph nodes in one transaction

```js
doc.transaction(function(tx) {
  tx.create({
    id: "p1",
    type: "paragraph",
    content: "Hi I am a Substance paragraph."
  });

  tx.create({
    id: "p2",
    type: "paragraph",
    content: "And I am the second pargraph"
  });
});


```

A Substance document works like an object store, you can create as many nodes as you wish and assign unique id's to them. However in order to show up as content, we need to show them on a container.

```js
doc.transaction(function(tx) {
  // Get the body container
  var body = tx.get('body');

  body.show('p1');
  body.show('p2');
});
```

Now let's make a **strong** annotation. In Substance annotations are stored separately from the text. Annotations are just regular nodes in the document. They refer to a certain range (`startOffset, endOffset`) in a text property (`path`).

```js
doc.transaction(function(tx) {
  tx.create({
    "id": "s1",
    "type": "strong",
    "path": [
      "p1",
      "content"
    ],
    "startOffset": 10,
    "endOffset": 19
  });
});
```

## Developing editors

In order to build your own editor based on Substance we recommend that you poke into the code of existing editors. HtmlEditor implements an editor for HTML content in [under 200 lines of code](https://github.com/substance/html-editor/blob/master/src/html_editor.js).


### Editor initialization

Editors need to setup a bit of Substance infrastructure first, most importantly a Substance Surface, that maps DOM selections to internal document selections. Here's the most important parts from the initialization phase.

```js
this.surfaceManager = new Substance.Surface.SurfaceManager(doc);
this.clipboard = new Substance.Surface.Clipboard(this.surfaceManager, doc.getClipboardImporter(), doc.getClipboardExporter());
var editor = new Substance.Surface.ContainerEditor('body');
this.surface = new Surface(this.surfaceManager, doc, editor);
```

A Surface instance requires a `SurfaceManager`, which keeps track of multiple Surfaces and dispatches to the currently active one. It also requires an editor. There are two kinds of editors: A ContainerEditor manages a sequence of nodes, including breaking and merging of text nodes. A FormEditor by contrast allows you to define a fixed structure of your editable content. Furthermore we initialized a clipboard instance and tie it to the Surface Manager.

We also setup a registry for components (such as Paragraph) and tools (e.g. EmphasisTool, StrongTrool). Our editor will then be able to dynamically retrieve the right view component for a certain node type.



<!-- ## Getting started

Let's develop a basic Rich Text Editor using Substance. We will define a simple article format, and an editor to manipulate it in the browser. Follow our guide here to get a feeling about the available concepts. Get your hands dirty by playing around with our [starter package](https://github.com/substance/starter) and if you feel more ambitious you can look at our [Science Writer](https://github.com/substance/science-writer) app.

### Define a custom article format

Modelling a schema is easy.

```js
var schema = new Substance.Document.Schema("rich-text-article", "1.0.0");
```

Substance has a number of predefined commonly used Node types, that we are going to borrow for our schema. But defining our own is very simple too. We'll define a node type highlight, just as another annotation type. We choose to use a container annotation type, which means that the annotation can span over multiple paragraphs. Regular annotations (like our emphasis and strong) are scoped to one text property.

```js
var Paragraph = Substance.Document.Paragraph;
var Emphasis = Substance.Document.Emphasis;
var Strong = Substance.Document.Strong;

var Highlight = Document.ContainerAnnotation.extend({
  name: 'highlight',
  properties: {
    created_at: 'date'
  }
});

schema.addNodes([
  Paragraph,
  Emphasis,
  Strong,
  Highlight
]);
```

We need to specify a default text type, which will be the node being created when you hit enter.

```js
schema.getDefaultTextType = function() {
  return "paragraph";
};
```

Based on Substance Document, we now define a Javascript class, that will hold our future documents.

```js
var RichTextArticle = function() {
  RichTextArticle.super.call(this, schema);
};

RichTextArticle.Prototype = function() {
  this.initialize = function() {
    this.super.initialize.apply(this, arguments);

    // We will create a default container node `body` that references arbitrary many
    // content nodes, most likely paragraphs.
    this.create({
      type: "container",
      id: "body",
      nodes: []
    });
  };
};

Substance.inherit(RichTextArticle, Document);

RichTextArticle.schema = schema;
```

### Create an article programmatically

Create a new document instance.

```js
var doc = new RichTextArticle();
```

Create several paragraph nodes

```js
doc.create({
  id: "p1",
  type: "paragraph",
  content: "Hi I am a Substance paragraph."
});

doc.create({
  id: "p2",
  type: "paragraph",
  content: "And I am the second pargraph"
});
```

A Substance document works like an object store, you can create as many nodes as you wish and assign unique id's to them. However in order to show up as content, we need to show them on a container.

```js
// Get the body container
var body = doc.get('body');

body.show('p1');
body.show('p2');
```

Now let's make a **strong** annotation. With Substance you store annotations separate from the text. Annotations are just regular nodes in the document. They refer to a certain range (startOffset, endOffset) in a text property (path).

```js
doc.create({
  "id": "s1",
  "type": "strong",
  "path": [
    "p1",
    "content"
  ],
  "startOffset": 10,
  "endOffset": 19
});
```

So that's enough for the start. Now let's create an editor.

### Build an editor

See: [editor.js](https://github.com/substance/starter/blob/master/src/editor.js)

We're using React for our example, but be aware that you can use Substance with any other web framework, or not use a framework at all.

Our Editor component receives the document as an input. Now as a first step, our editor should be able to render the document passed in. We will set up a bit of Substance infrastructure first, most importantly a Substance Surface, that maps DOM selections to internal document selections.

#### Editor initialization

```js
this.surfaceManager = new Substance.Surface.SurfaceManager(doc);
this.clipboard = new Substance.Surface.Clipboard(this.surfaceManager, doc.getClipboardImporter(), doc.getClipboardExporter());
var editor = new Substance.Surface.ContainerEditor('body');
this.surface = new Surface(this.surfaceManager, doc, editor);
```

A Surface instance requires a `SurfaceManager`, which keeps track of multiple Surfaces and dispatches to the currently active one. It also requires an editor. There are two kinds of editors: A ContainerEditor manages a sequence of nodes, including breaking and merging of text nodes. A FormEditor by contrast allows you to define a fixed structure of your editable content. Furthermore we initialized a clipboard instance and tie it to the Surface Manager.

We also setup a registry for components (such as Paragraph) and tools (e.g. EmphasisTool, StrongTrool). Our editor will then be able to dynamically retrieve the right view component for a certain node type.


We also need to hook into `componentDidMount` to attach our Surface and clipboard to the corresponding DOM elements as soon as they get available.

```js
componentDidMount() {
  var doc = this.props.doc;

  doc.connect(this, {
    'document:changed': this.onDocumentChanged
  });

  this.surfaceManager.registerSurface(this.surface, {
    enabledTools: ENABLED_TOOLS
  });

  this.surface.attach(this.refs.bodyNodes.getDOMNode());

  this.surface.connect(this, {
    'selection:changed': this.onSelectionChanged
  });

  this.clipboard.attach(React.findDOMNode(this));


  this.forceUpdate(function() {
    this.surface.rerenderDomSelection();
  }.bind(this));
}
```

We bind some event handlers:

  - `onDocumentChange` to trigger an editor rerender if the container changes (a node is added or removed)
  - `onSelectionChanged` to update the tools based on the new document selection

We'll look into those handler implementations later. First, let's render our document.

#### Render the document

For each node type we defined we need to define a component class with a render method. Here's how our paragraph implementation looks like:


See: [components/paragraph.js](https://github.com/substance/starter/blob/master/src/components/paragraph.js)

```js
var TextProperty = require('substance-ui/text_property');
var $$ = React.createElement;

class Paragraph extends React.Component {
  render() {
    return $$("div", { className: "content-node paragraph", "data-id": this.props.node.id },
      $$(TextProperty, {
        doc: this.props.doc,
        path: [ this.props.node.id, "content"]
      })
    );
  }
}
```

The paragraph is represented as a simple div. However the text rendering is where things get difficult. Substance provides a generic implementation TextProperty for rendering annotated text. We just use this component here and refer to a path (paragraph id and property name).

We don't need to implement annotation nodes (strong, emphasis), as there is a default renderer implemented for annotations. Now that we have our components ready, we can head over to implementing the `render` method of our editor:


```js
render() {
  var doc = this.props.doc;
  var containerNode = doc.get('body');
  var components = [];

  components = components.concat(containerNode.nodes.map(function(nodeId) {
    var node = doc.get(nodeId);
    var ComponentClass = this.componentRegistry.get(node.type);
    return $$(ComponentClass, { key: node.id, doc: doc, node: node });
  }.bind(this)));

  return $$('div', {className: 'editor-component'},
    $$('div', {className: 'toolbar'},
      $$(ToolComponent, { tool: 'emphasis', title: 'Emphasis', classNames: ['button', 'tool']}, "Emphasis"),
      $$(ToolComponent, { tool: 'strong', title: 'Strong', classNames: ['button', 'tool']}, "Strong")
    ),
    $$('div', {className: 'body-nodes', ref: 'bodyNodes', contentEditable: true, spellCheck: false},
      components
    )
  );
}
```

Essentially what we do is iterating over all nodes of our body container, determining the ComponentClass and constructing a React.Element from it. We also provided a simple toolbar, that has annotation toggles. We will learn more about tools later when we implement a custom tool for our editor.




### Anatomy of a Substance Document

TODO: describe

- Nodes
- Properties
- Containers


### Transactions

When you want to update a document, you should wrap all your changes in a transaction, so you don't end up in inconsistent in-between states. The API is fairly easy:

```js
doc.transaction(function(tx) {
  tx.delete("em2"); // deletes an emphasis annotation with id em2
});
```

```js
var updated = "Hello world!";
doc.transaction(function(tx) {
  tx.set([text_node_1, "content"], updated); // updates content property of node text_node_1
});
```

-->

## Development

### Testing

1. Running the test-suite headless (using Phantom.js)

```
$ npm test
```

2. Running the test-suite in a browser for debugging:

```
$ npm start
```

Then open http://localhost:4201/test in your browser.

3. Running test-suite using Karma to generate a code coverage report.

```
$ npm run karma
```

The report will be stored in the `coverage` folder.
