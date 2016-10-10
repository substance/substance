The fastest way to try out Substance is including it as a script into your website.

Download the latest distribution from our [releases page on Github](https://github.com/substance/substance/releases). There's a zip file attached to each release.

```html
<script type="text/javascript" src="./substance/substance.js"/></script>
<link rel="stylesheet" type="text/css" href="substance/substance.css"/>
<link rel="stylesheet" type="text/css" href="substance/substance-reset.css"/>
<link rel="stylesheet" type="text/css" href="substance/substance-pagestyle.css"/>
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