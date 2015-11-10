All you need for defining custom article formats and manipulate them. If you want to update a document, you must wrap your changes in a transaction, to avoid inconsistent in-between states. The API is fairly easy. 

Let's create two paragraph nodes in a transaction.

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

