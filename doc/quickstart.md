The fastest way to try out Substance is including it as a script into your website.

```html
<script type="text/javascript" src="http://cdn.substance.io/substance-1.0.0-beta.5.1.js"/></script>
<link rel="stylesheet" type="text/css" href="http://cdn.substance.io/substance-1.0.0-beta.5.1.css"/>
```

Now you can start using Substance API's. The code below works in all modern browsers that support ES2015.

```js
const { ProseEditor, ProseEditorPackage, SuperscriptPackage, Configurator } = substance

const fixture = function(tx) {
  let body = tx.get('body')
  tx.create({
    id: 'p1',
    type: 'paragraph',
    content: 'Hello world.'
  })
  body.show('p1')
}

const cfg = new Configurator()
cfg.import(ProseEditorPackage)
cfg.import(SuperscriptPackage)

window.onload = function() {
  let doc = configurator.createArticle(fixture)
  let documentSession = new DocumentSession(doc)
  ProseEditor.mount({
    documentSession: documentSession,
    configurator: configurator
  }, document.body)
}
```

## Install as package

Of course Substance can be used via npm and integrated into development toolchains, such as Rollup, Browserify, Webpack. To learn more please read the {@link integrating-substance} guide.