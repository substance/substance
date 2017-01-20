Substance is a library for creating web-based WYSIWYG editors with all the features you would expect.

As opposed to other existing editors, such as TinyMCE, Aloha etc. Substance is not a widget you include into your web app. It is a library. Widgets can lead to a bad UX. They can be considered alien isles within a web-app. And those are very limited regarding customization.

The unique point of Substance is **Customizability**. You can **customize everything**. And we make this as simple as possible for you.

Building an editor starts with the data. For instance, a scientific article is more complex than a blog post. Still, there is some similarity. Both of them have paragraphs, for instance. In Substance you define a schema, containing a set of Node descriptions.

```js
class Todo extends TextBlock {}

Todo.schema = {
  type: 'todo',
  content: 'text',
  done: { type: 'bool', default: false}
}
```

Probably you are already using a certain data format, XML files or HTML. With Substance you can create a custom converter very easily.

```js
export default {
  type: 'todo',
  tagName: 'div',
  matchElement: function(el) {
    return el.is('div') && el.hasClass('todo')
  },
  import: function(el, node, converter) {
    node.content = converter.annotatedText(el, [node.id, 'content'])
    node.done = el.attr('data-done') === '1'
  },
  export: function(node, el, converter) {
    el.append(converter.annotatedText([node.id, 'content']))
      .addClass('todo')
      .attr('done', node.done ? '1': '0');
  }
}
```

You can customize many more things: how content get rendered, toolbars with individual tools, and content transformations.

## What makes Substance unique?

- Produce and edit HTML, XML, or any kind of content format
- Multiple editing surfaces (e.g. one for the title, one for the document body)
- Annotations can span over multiple paragraphs
- Reusable components (SplitPane, ScrollPane, ContainerEditor, Toolbar, ...)
- Realtime collaboration can be enabled for any Substance editor

For a complete list of features see [here](https://github.com/substance/substance#features).


## Who is using it?

Substance has been used to power a scientific reading tool called [eLife Lens](http://elifesciences.org/elife-news/lens), which is used by [eLife](http://elifesciences.org/), the [American Mathematical Society](http://www.ams.org/home/page) and [other publishers](http://elifesciences.org/elife-news/Lens-pioneered-by-eLife-to-be-piloted-by-six-additional-publishers-on-HighWire).

[Texture](http://substance.io/texture) builds on Substance to realize a WYSIWYG [JATS XML](http://jats.nlm.nih.gov/archiving/tag-library/1.1/) editor. Substance is also used to power digital archives with [Archivist](https://medium.com/@_daniel/publish-interactive-historical-documents-with-archivist-7019f6408ee6), data-driven documents at [Stencila](http://stenci.la/) and news editors at [Infomaker](http://www.infomaker.se/). Substance is a crucial building block of PubSweet, the decoupled full-featured content production system developed by the [Collaborative Knowledge Foundation](http://coko.foundation/)

## What's the state of development?

The latest release is Substance 1.0 Beta 5. The API is fairly stable and most interfaces are documented. There will be one or two more beta releases, stabilizing the features before we freeze the API for a 1.0 release.

## License?

Substance is completely free and available as [Open Source](http://github.com/substance/substance) under an MIT license.

## How do I get started?

As a web-developer, jump right over to the {@link guides} section and learn how to define a custom article, write an HTML converter for it and build an editor component.

Also check out [SimpleWriter](https://github.com/substance/simple-writer) our editor reference implementation, and the [examples](https://github.com/substance/examples) for learning about individual features.


Tell us about your experiences and let us know what you liked and what's missing to solve your use-case. We're glad for feedback and contributions in any form.

Happy editor building!

Michael and Oliver.