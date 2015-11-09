[Substance](https://github.com/substance/substance) is a JavaScript library for web-based content editing. 

* **Content is data:** Substance documents are Javascript data structures that are modified through operations.
* **Everything custom:** Design and build your application from ground up by *defining a custom article format* and *providing UI components* for indivdual rendering. You have full control about the markup and interaction. Substance implements reactive rendering (think React) to abstract the DOM away and make rendering as easy as implementing a `render` method per component.

### Examples

The following snippets are not complete but should give you a feeling on how Substance components are used.

Create a `TextPropertyEditor` for the `name` property of an author object. Allow emphasis annotations.

```js
$$(TextPropertyEditor, {
  name: 'authorNameEditor',
  path: ['author_1', 'name'],
  commands: [EmphasisCommand]
})
```

Create a full-fledged `ContainerEditor` for the `body` container of a document. Allow Strong and Emphasis annotations and to switch text types between paragraph and heading at level 1.

```js
$$(ContainerEditor, {
  name: 'bodyEditor',
  containerId: 'body',
  textTypes: [
    {name: 'paragraph', data: {type: 'paragraph'}},
    {name: 'heading1',  data: {type: 'heading', level: 1}}
  ],
  commands: [StrongCommand, EmphasisCommand, SwitchTextTypeCommand],
})
```

## Custom Article Schema

Substance lets you define completely custom article schemas.

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

### Transformations

Transformations are there to define higher level document operations that editor implementations can use. We implemented a range of useful transformations and made them available in the `model/transform` module. However, you are encouraged to define your own functions. Below is a shortened version of a possible searchAndReplace transformation.

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
```

Transformations always take 2 parameters: `tx` is a `TransactionDocument` and `args` are the transformation's arguments. Transformations can be composed, so in a transformation you can call another transformation. You just need to be careful to always set the args properly. Here's how the transformation we just defined can be called in a transaction.

```js
surface.transaction(function(tx, args) {
  args.searchStr = "foo";
  args.replaceStr = "bar";
  return searchAndReplace(tx, args);
});
```

Using the transaction method on a Surface instance passes the current selection to the transformation automatically. So you will use surface transactions whenever some kind of selection is involved in your action. However, you could also provide the selection manually and call `transaction()` on the document or app controller instance. Make sure that your transformations are robust for both scenarios. If you look at the above example under (3) we set the selection to the last matched element after search and replace. If something has been found.

### Building an editor UI

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

Let's now look at the config object;

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