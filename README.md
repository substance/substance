# Substance 

Substance is a JavaScript library for web-based content editing. It provides building blocks for realizing custom text editors web-based publishing systems.

See Substance in action:

- **[Prose Editor](http://substance.io/demos/prose-editor)** - A minimal rich text editor component
- **[Notepad](http://substance.io/demos/notepad)** - A custom note editor
- **[eLife Lens](http://lens.elifesciences.org/00778/)** - A novel scientific reader

## Motivation

Building a web editor is a hard task. Native browser support for text editing is [limited and not reliable](https://medium.com/medium-eng/why-contenteditable-is-terrible-122d8a40e480). There are many pitfalls such as handling selections, copy&paste or undo/redo. Substance was developed to solve the common problems of web-editing and provides API's for building custom editors.

With Substance you can:

- Define a [custom article schema](https://github.com/substance/demos/blob/master/notepad/note.js)
- Manipulate content and annotations using *operations* and *transactions*
- Define a custom HTML structure and attach a `Substance Surface` on it to make it editable
- Implement custom tools for any possible task like toggling annotations, inserting content or replacing text
- Control *undo/redo* behavior and *copy&paste*
- and much more.

## Getting started

Substance provides a ready to use [Editor](https://github.com/substance/demos/tree/master/prose-editor) component. It can be injected easily into an existing web application.

```js
var Editor = require('substance/ui/editor');
var Component = require('substance/ui/component');
var $$ = Component.$$;
var proseEditor = Component.mount($$(Editor, {
  content: '<p>hello world</p>'
}), $('#editor_container'));
```

Substance Editor takes HTML as an input and lets you access to edited content at any time.

```js
proseEditor.getContent();
```

Behind the curtains, your document is converted to a Javascript document model, that guarantees you a reliable and sideffect-free editing experience. You have access to this data as well.

```js
proseEditor.getDocument();
```

You may likely want to customize that editor a bit. For instance you want to restrict the supported content types and customize the toolbar accordingly. This is all possible by [patching your very own HtmlEditor](https://github.com/substance/demos/tree/master/notepad).

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

We provide a reference implementation, the [Substance Article](article.js). Usually want to come up with your own schema and only borrow common node types such as paragraphs and headings. The Notepad demo implements a [nice example for reference](https://github.com/substance/demos/blob/master/notepad/note.js)

<!--Lens Writer defines a [scientific article](https://github.com/substance/lens-writer/tree/master/lib/article) including bib items and figures with captions etc.-->


## Manipulate documents programmatically

Substance documents can be manipulated incrementally using simple operations. Let's grab an existing article implementation and create instances for it.

```js
var Article = require('substance/article');
var doc = new Article();
```

When you want to update a document, you must wrap your changes in a transaction, to avoid inconsistent in-between states. The API is fairly easy. Let's create several paragraph nodes in one transaction.

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

Look at our [reference implementation](https://github.com/substance/substance/blob/master/ui/editor/editor.js) for orientation.

### Editor initialization

Editors need to setup a bit of Substance infrastructure first, most importantly a Substance Surface, that maps DOM selections to internal document selections. 

```js
this.surfaceManager = new Substance.Surface.SurfaceManager(doc);
this.clipboard = new Substance.Surface.Clipboard(this.surfaceManager, doc.getClipboardImporter(), doc.getClipboardExporter());
var editor = new Substance.Surface.ContainerEditor('body');
this.surface = new Surface(this.surfaceManager, doc, editor);
```

A Surface instance requires a `SurfaceManager`, which keeps track of multiple Surfaces and dispatches to the currently active one. It also requires an editor. There are two kinds of editors: A ContainerEditor manages a sequence of nodes, including breaking and merging of text nodes. A FormEditor by contrast allows you to define a fixed structure of your editable content. Furthermore we initialized a clipboard instance and tie it to the Surface Manager.

We also setup a registry for components (such as Paragraph) and tools (e.g. EmphasisTool, StrongTrool). Our editor will then be able to dynamically retrieve the right view component for a certain node type.

To learn how to build your own editor check out [this tutorial](https://github.com/substance/demos/tree/master/notepad) on creating a Notepad editor with Substance.

<!--
### Anatomy of a Substance Document

TODO: describe

- Nodes
- Properties
- Containers

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
