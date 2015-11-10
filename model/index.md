Provides model-related functionality from defining an article format to manipulating it through transformations.

## Custom Article Schema

Substance lets you define completely custom article formats.

```js
var Paragraph = require('substance/packages/paragraph/Paragraph');
var Emphasis = require('substance/packages/emphasis/Emphasis');
var Strong = require('substance/packages/emphasis/Strong');
var Annotation = require('substance/ui/Annotation');

var Comment = Annotation.extend({
  name: 'comment',
  properties: {
    content: 'string'
  }
});

var schema = new Document.Schema('my-article', '1.0.0');
schema.getDefaultTextType = function() {
  return "paragraph";
};
schema.addNodes([Paragraph, Emphasis, Strong, Comment]);
```

Based on that schema, we define an article class.

```js
var Document = require('substance/model/Document');
var Article = function(schema) {
  Document.call(schema);

  // We set up a container that holds references to
  // block nodes (in our example paragraphs)
  this.create({
    type: "container",
    id: "body",
    nodes: []
  });
};

OO.inherit(Article, Document);
```

## Document manipulation

Substance documents are manipulated incrementally using operations.

```js
var doc = new Article();
```

When you want to update a document, you must wrap your changes in a transaction, to avoid inconsistent in-between states. The API is fairly easy. Let's create two paragraph nodes in one transaction.

```js
doc.transaction(function(tx) {
  tx.create({
    id: 'p1',
    type: 'paragraph',
    content: 'Hi I am a Substance paragraph.'
  });
  tx.create({
    id: 'p2',
    type: 'paragraph',
    content: 'And I am the second pargraph'
  });
});
```

A Substance document works like an object store, you can create as many nodes as you wish and assign unique id's to them. In order to create a sequence of nodes, we have to `show` them on a container node.

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
    id: 's1',
    type: 'strong',
    path: ['p1', 'content'],
    "startOffset": 10,
    "endOffset": 19
  });
});
```

That is more or less how the low-level API works.