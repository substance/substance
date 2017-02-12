This guide will teach you how to build a simple Substance editor (SimpleWriter) with basic editing functionalities. The complete and fully functional code can be found on [Github](http://github.com/substance/simple-writer).

## The model

Let's start with defining a model that our editor can operate on. We want to support the following node types:

- `Body` - holds references to the actual content elements
- `Paragraph` a text paragraph that can be annotated
- `Heading` Headings of 3 different levels
- `Strong` Annotation that marks text as **strong**
- `Emphasis` Annotation that marks text as *emphasized*
- `Link` Link annotation
- `Comment` Comments in the text

Substance has a number of preimplemented node types, so we only need define the Body and Comment nodes.

The body node inherits from {@link Container}.

```js
class Body extends Container {}

Body.schema = {
  type: 'body'
}
```

The Comment node is a {@link PropertyAnnotation} and defines a content property to hold the comment text.

```
class Comment extends PropertyAnnotation {}

Comment.schema = {
  type: 'comment',
  content: { type: 'string', default: '' }
}
```

## Node Converters

We choose HTML as a serialization format for our article. Hence, we need to define a converter for our body node, which converts an HTML body element to a body node referencing a sequence of content nodes (paragraphs, headings, …).

```js
export default {
  type: 'body',
  tagName: 'body',
  import: function(el, node, converter) {
    node.id = 'body'
    node.nodes = el.children.map(function(child) {
      var childNode = converter.convertElement(child)
      return childNode.id
    })
  },
  export: function(node, el, converter) {
    el.append(converter.convertNodes(node.nodes))
  }
}
```

And here is the converter for the comment node.

```js
export default {

  type: 'comment',
  tagName: 'span',

  matchElement: function(el) {
    return el.is('span[data-type="comment"]')
  },

  import: function(el, node) {
    node.content = el.attr('data-comment')
  },

  export: function(node, el) {
    el.attr({
      'data-type': 'comment',
      'data-comment': node.content
    }.append(node.content))
  }
}
```

In order to read an HTML file we need to provide an HTMLImporter. This one just finds the body element and delegates the conversion to the converter specified in the body package.

```js
class SimpleHTMLImporter extends HTMLImporter {
  convertDocument(htmlEl) {
    var bodyEl = htmlEl.find('body')
    this.convertElement(bodyEl)
  }
}
```

## Node Components

For each node, we need to implement a Component in order to display it. The body element for us will be where editing starts. Containers can be made editable by just wrapping them in a {@link ContainerEditor}.

```js
class BodyComponent extends Component {
  render($$) {
    let node = this.props.node;
    let el = $$('div')
      .addClass('sc-body')
      .attr('data-id', this.props.node.id);

    el.append(
      $$(ContainerEditor, {
        disabled: this.props.disabled,
        node: node,
        commands: this.props.commands,
        textTypes: this.props.textTypes
      }).ref('body')
    )
    return el;
  }
}
```

## Commands

In order to create comments in the user interface, we need to define a {@link Command} for it.

```js
class CommentCommand extends AnnotationCommand {
  canFuse() { return false }
  canDelete() { return false }
}
```

## Tool Components

In order to edit comments we provide a tool component for it.

```js
class EditCommentTool extends Tool {

  render($$) {
    let Input = this.getComponent('input')
    let Button = this.getComponent('button')
    let el = $$('div').addClass('sc-edit-comment-tool')

    el.append(
      $$(Input, {
        type: 'text',
        path: [this.props.node.id, 'content'],
        placeholder: 'Please enter comment here'
      }),
      $$(Button, {
        icon: 'delete',
        style: this.props.style
      }).on('click', this.onDelete)
    )
    return el
  }
  ...
}
```

## Nodes as packages

Substance uses packages where possible, to be able to extend editors with new functionalities. Each plugin/extension comes with it's own package definition.

Here's the `BodyPackage`.


```js
export default {
  name: 'body',
  configure: function(config) {
    config.addNode(Body)
    config.addComponent(Body.type, BodyComponent)
    config.addConverter('html', BodyConverter)
  }
}
```

And the `CommentPackage`.

```js
export default {
  name: 'link',
  configure: function(config, options) {
    config.addNode(Comment)
    config.addConverter('html', CommentConverter)

    // Tool to insert a new comment
    config.addCommand('comment', CommentCommand, {nodeType: 'comment'})
    config.addTool('comment', AnnotationTool, {target: options.toolTarget || 'annotations'})
    // Tool to edit an existing comment, should be displayed as an overlay
    config.addCommand('edit-comment', EditAnnotationCommand, {nodeType: 'comment'})
    config.addTool('edit-comment', EditCommentTool, { target: 'overlay' })

    // Icons and labels
    config.addIcon('comment', { 'fontawesome': 'fa-comment'})
    config.addLabel('comment', 'Comment')
  }
}
```

Now we provide a configuration on editor level.

```js
import {
  BasePackage, StrongPackage, EmphasisPackage, LinkPackage, Document,
  ParagraphPackage, HeadingPackage
} from 'substance'

export default {
  name: 'simple-writer',
  configure: function (config) {
    config.defineSchema({
      name: 'simple-article',
      ArticleClass: Document,
      defaultTextType: 'paragraph'
    })

    // BasePackage provides core functionaliy, such as undo/redo
    // and the SwitchTextTypeTool. However, you could import those
    // functionalities individually if you need more control
    config.import(BasePackage)

    // core nodes
    config.import(ParagraphPackage)
    config.import(HeadingPackage)
    config.import(StrongPackage, {toolTarget: 'annotations'})
    config.import(EmphasisPackage, {toolTarget: 'annotations'})
    config.import(LinkPackage, {toolTarget: 'annotations'})

    // custom nodes
    config.import(BodyPackage)
    config.import(CommentPackage, {toolTarget: 'annotations'})

    // Override Importer/Exporter
    config.addImporter('html', SimpleHTMLImporter)
  }
}
```

## Define a SimpleWriter component.

The SimpleWriter component forms our editor's heart. Some basic Substance infrastructure is set up by AbstractEditor, which we inherit from. We need to implement {@link AbstractEditor#render}. Substance uses a {@link Component} API similar to [React](https://facebook.github.io/react/), which should be easy to understand.

The following code shows the setup of an editor, rendering a toolbar and the document's body. We delegate setting up the editor to the Body component, which is defined in a package and sets up the actual editor.

```js
class SimpleWriter extends AbstractEditor {

  render($$) {
    let SplitPane = this.componentRegistry.get('split-pane')
    let el = $$('div').addClass('sc-simple-writer')
    let ScrollPane = this.componentRegistry.get('scroll-pane')
    let Overlay = this.componentRegistry.get('overlay')
    let ContextMenu = this.componentRegistry.get('context-menu')
    let Dropzones = this.componentRegistry.get('dropzones')
    let commandStates = this.commandManager.getCommandStates()
    let configurator = this.props.editorSession.getConfigurator()
    let Body = this.componentRegistry.get('body')
    let contentPanel = $$(ScrollPane, {
      scrollbarPosition: 'right'
    }).append(
      $$(Body, {
        disabled: this.props.disabled,
        node: this.doc.get('body'),
        commands: configurator.getSurfaceCommandNames(),
        textTypes: configurator.getTextTypes()
      }).ref('body'),
      $$(Overlay),
      $$(ContextMenu),
      $$(Dropzones)
    ).ref('contentPanel')

    el.append(
      $$(SplitPane, {splitType: 'horizontal'}).append(
        $$('div').addClass('se-toolbar-wrapper').append(
          $$(Toolbar, {
            commandStates: commandStates
          }).ref('toolbar')
        ),
        contentPanel
      )
    )
    return el
  }
}
```

## Use your new editor

```js
let cfg = new Configurator()
cfg.import(SimpleWriterPackage)

window.onload = function() {
  // Import article from HTML markup
  let importer = cfg.createImporter('html')
  let doc = importer.importDocument(fixture)
  // This is the data structure manipulated by the editor
  let editorSession = new EditorSession(doc, {
    configurator
  })
  // Mount SimpleWriter to the DOM and run it.
  SimpleWriter.mount({
    editorSession: editorSession
  }, document.body)
}
```

Find the complete code for [SimpleWriter](https://github.com/substance/simple-writer) on Github.

## Exercises

- Enable a Substance core node type (e.g. Superscript, Image) for SimpleWriter (very easy)
- Create a simple Highlight node type to emphasize parts of the text with a yellow background. Serialize as `<span data-type="highlight">...</span>` Tip: Look at existing implementations such as Strong. (easy)
- Create a new text type FancyParagraph, that works like a regular paragraph, just with different styles. Serialize as `<p data-type="fancy">...</p>` (easy)
- Create a simple Person node type with properties `firstname`, `lastname`, which are editable via regular input elements. Look at [Input Example](https://github.com/substance/examples/tree/master/input) as a reference implementation. Create a tool that allows insertion of Person nodes into the document (as a block element). Serialize as `<div data-type="person" data-firstname="John" data-lastname="Doe"></div>`. (medium)
- Create new Monster node type that can be inserted inside the text. See [InlineNode example](https://github.com/substance/examples/tree/master/inline-node) as a reference implementation. Render a monster as small image that appears in the text. Bonus points: Allow different monster types and provide UI to change the monster type. Render a different image for each monster type. (medium)
