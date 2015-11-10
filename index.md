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
