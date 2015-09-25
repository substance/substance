# Substance [![Build Status](https://travis-ci.org/substance/substance.svg?branch=master)](https://travis-ci.org/substance/substance)

Substance is a JavaScript library for web-based content editing. It provides building blocks for realizing custom text editors and web-based publishing systems.

Demos:

- **[Prose Editor](http://substance.io/demos/prose-editor)** - A minimal rich text editor
- **[Notepad](http://substance.io/demos/notepad)** - A custom note editor

In the wild:

- **[Lens Writer](http://substance.io/lens-writer)** - A scientific writer component
- **[Archivist](https://medium.com/@_daniel/publish-interactive-historical-documents-with-archivist-7019f6408ee6)** - A platform for publishing interactive interview transcriptions
- **[eLife Lens](http://lens.elifesciences.org/00778/)** - A novel scientific reader


## Motivation

Building a web editor is a hard task. Native browser support for text editing is [limited and not reliable](https://medium.com/medium-eng/why-contenteditable-is-terrible-122d8a40e480). There are many pitfalls such as handling selections, copy&paste or undo/redo. Substance was developed to solve the common problems of web-editing and provides API's for building custom editors.

## Features

Features                                                                    | State
--------------------------------------------------------------------------- | :------------:
Custom document schemas                                                     | ✓ 
Custom converters (XML, HTML, etc.)                                         | ✓
Custom HTML Rendering                                                       | ✓
Annotations that can span over multiple nodes                               | ✓
Annotations can hold information (e.g. a comment)                           | ✓
Incremental document updates (undoable operations)                          | ✓
Transformations for document manipulation                                   | ✓
Custom editing toolbars                                                     | ✓
Commands for controlling the editor                                         | Beta 2
Realtime collaboration                                                      | Beta 3
Full Unicode support                                                        | Beta 3
Plugins                                                                     | Beta 3
Persistence API for documents                                               | Beta 4
                                                                            |
**UI Widgets**                                                              |
Ready-to-use [Editor](http://substance.io/demos/prose-editor)               | ✓
Writer interface for building full-fledged custom editing apps              | Beta 2
                                                                            |
**Predefined content types**                                                |
Paragraph                                                                   | ✓ 
Heading                                                                     | ✓
Blockquote                                                                  | ✓
Codeblock                                                                   | ✓
Resource (image, video, tweet etc.)                                         | Beta 2
List                                                                        | Beta 2
Table                                                                       | Beta 3
Figure (including upload)                                                   | Beta 4
                                                                            |
**Predefined annotation types**                                             |
Strong                                                                      | ✓ 
Emphasis                                                                    | ✓ 
Link                                                                        | ✓ 
Subscript                                                                   | Beta 2
Superscript                                                                 | Beta 2
Comment                                                                     | Beta 3


## Getting started

Substance provides a ready to use [Editor](https://github.com/substance/demos/tree/master/prose-editor) component. It can be integrated easily into an existing web application.

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

You may want to restrict the supported content types and customize the toolbar a bit. Or you decide to define completely new content types. This is all possible by [patching your very own editor](https://github.com/substance/demos/tree/master/notepad).

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

We provide a reference implementation, the [Substance Article](article.js). However, you may want to come up with your own schema and only borrow common node types such as paragraphs and headings. The Notepad demo implements a [nice example for reference](https://github.com/substance/demos/blob/master/notepad/note.js).

Lens Writer defines a [scientific article](https://github.com/substance/lens-writer/tree/master/lib/article) including bib items and figures with captions etc.

## Manipulate documents programmatically

Substance documents can be manipulated incrementally using simple operations. Let's grab an existing article implementation and create instances for it.

```js
var Article = require('substance/article');
var doc = new Article();
```

### Transactions

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

### Transformations

Transformations are there to define higher level document operations that editor implementations can use. We implemented a range of useful [transformations](document/transformations) that editor implementations can use. However, you are encouraged to define your own. Below is a shortened version of a possible searchAndReplace transformation.

```js
function searchAndReplace(tx, args) {
  // 1. verify arguments args.searchStr, args.replaceStr, args.container
  // 2. implement your transformation using low level operations (e.g. tx.create)
  // ...
  var searchResult = search(tx, args);
  
  searchResult.matches.forEach(function(match) {
    var replaceArgs = _.extend({}, args, {selection: match, replaceStr: args.replaceStr});
    replaceText(tx, replaceArgs);
  });
  
  // 3. set new selection
  if (searchResult.matches.length > 0) {
    var lastMatch = _.last(searchResult.matches);
    args.selection = lastMatch;
  }
  
  // 4. return args for the caller or transaction context
  return args;
}
module.exports = searchAndReplace;
```

Transformations always take 2 parameters: `tx` is a document transaction and `args` are the transformation's arguments. Transformations are combinable, so in a transformation you can call another transformation. You just need to be careful to always set the args properly. Here's how the transformation we just defined can be called in a transaction.

```js
surface.transaction(function(tx, args) {
  args.searchStr = "foo";
  args.replaceStr = "bar";
  return searchAndReplace(tx, args);
});
```

Using the transaction method on a Surface instance passes the current selection to the transformation automatically. So you will use surface transactions whenever some kind of selection is involved in your action. If the selection doesn't matter you can use the same transformation within a `document.transaction` call. Make sure that your transformations are robust for both scenarios. If you look at the above example under (3) we set the selection to the last matched element after search and replace. If something has been found.

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


## Roadmap

### Beta 2

*ETA: November 1 2015*

- Support for nested nodes
- Editing of lists
- Resource node type (image, video, tweet etc.)
- CSS modularization: one css file per UI component
- Automatically published API docs
- Writer interface for building full-fledged custom editing apps
- Improved stability, documentation and tests

### Beta 3

- Automatically generated performance report
- Table node
- Novel Writer demo
- Plugins
- Realtime collaboration
- Improved Unicode support
- Improved stability, documentation and tests

### Beta 4

- Modules for server-side integration
  - Persistence API for documents
  - Figure upload
- Server-side realtime collaboration infrastructure
- Full-stack platform example

### 1.0 Final

- Complete documentation
- Full test coverage
- Final versions of API's