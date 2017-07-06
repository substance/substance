## Beta 7

- `InsertNodeCommand` should be provided with `config.nodeType` (similar to AnnotationCommand). While old code should still work right now, this will probably break in future.
- `editorSession.setSelection()` does not require explicit specification of
  `containerId` in most cases. Instead the information is derived from the
  surface if a `surfaceId` is given.
- Refactored MarkersManager:
  + generalized and streamlined API (no custom Node necessary anymore)
  + Markers are added cleared using `MarkersManager.setMarkers(key, markers)`
    and  `MarkersManager.clearMarkers(key)`
  + EditorSession.startFlow() must be called to roll-out changes of markers
  + SpellChecker has been updated accordingly
- Introduced `DOMElement.emit(event, data)` for custom events
- Improved several Commands (new option `disableCollapsedCursor`, disable when cursor on InlineNode)
- Surface allows to override core key event handlers via KeyboardManager
- Surface emits `tab` event
- Introduced `DocumentChange.info.skipSelectionRerender` to skip rendering the selection
- Introduced InsertTableCommand
- Introduced TextInputPackage
- Toolbox now rerenders on every change
- Introduced white-/black-list of commands to control which Commands are available in a specific Surface
- **(!)** changed the order of `Component.didMount()` call, now top-to-down, was bottom-to-up before
- InsertNodeCommand now sets cursor into inserted node
- TextPropertyComponent allows to render markers passed via props (as opposed to markers provided by MarkersManager)
- TextPropertyEditor emits 'enter' event
- Improved re-rendering performance
- Improved API for commands and tools
- `Container.show(nodeId, pos)` is deprecated.
  Use either `Container.show(nodeId)` or `Container.showAt(pos, nodeId)`
- `el.appendChild(null)` does not throw
- `el.insertBefore(child, null)` is equivalent to `el.appendChild(child)`
- `surface.focus()` now behaves similar to a HTML input element, i.e. setting the cursor to the first position
- fixed selection rendering for IsolatedNodes

These changes might break your current implementation and may need some migration:

- Changed behavior of `DefaultDOMElement.parseHTML()` and `parseXML()`:
  Now `DefaultDOMElement.parseHTML()` and `parseXML()` always return the DOM document, i.e., a `DOMElement` instance of type `document`.
  The former behavior was confusing and inconsistent.
  `parseHTML()` now always creates a 'full' HTML document, i.e. containing `<head>` and `<body>`

  If you want to parse *snippets* (as opposed to full documents), use:
  ```
    let el = DefaultDOMElement.parseSnippet('<p>Lorem ipsum dolor sit amet</p>', 'html')
    let els = DefaultDOMElement.parseSnippet('Lorem ipsum <b>dolor</b> sit amet', 'xml')

    ...or...

    let el = DefaultDOMElement.parseSnippet('<myNode>...</myNode>', 'xml')
    let els = DefaultDOMElement.parseSnippet('<myNode>...</myNode><myNode>...</myNode>', 'xml')
  ```
  Notice, that `parseSnippet` returns either one element, or an array of elements, depending on the input you provided.

-  `MemoryDOMElement` now always encodes and decodes entities. If you had
   your own workarounds in place, you might need to disable them now.

- `DOMImporter` (`HTMLImporter`/`XMLImporter`) takes two mandatory configuration parameters: `schema` and `converters`
  If you have used the `Configurator` API to create importers and exporters, you should be good.

- Changed signature of `Data` and `InrementalData` constructor: The second argument is now a node factory
  ```
  new IncrementalData(schema, this.nodeFactory)
  ```
- Removed some API which we don't want to support anymore:
  - `DOMElement.getRoot()`: use `el.getOwnerDocument()` instead
  - `Selection.getFragments()`: implementation was overly complicated.
    If you want to iterate nodes of a container selection use `sel.getNodeIds()`
  - `documentHelpers.getAnnotationsForSelection()`: use `documentHelpers.getPropertyAnnotation()` instead
  - `Document.fromSnapshot()`, `Document.loadSeed()`: both implementations were not reliable. Use `JSONConverter` instead.

- Changed API for configuring editing tools
  - Instead of assigning a `toolGroup` to a tool, we assign `commandGroup` to a command

    ```
    config.addCommand('heading1', SwitchTextTypeCommand, {
      spec: { type: 'heading', level: 1 }
      commandGroup: 'text-types'
    })
    config.addCommand('heading2', SwitchTextTypeCommand, {
      spec: { type: 'heading', level: 2 },
      commandGroup: 'text-types'
    })
    config.addCommand('heading3', SwitchTextTypeCommand, {
      spec: { type: 'heading', level: 3 },
      commandGroup: 'text-types'
    })
    config.addKeyboardShortcut('CommandOrControl+alt+1', { command: 'heading1' })
    config.addKeyboardShortcut('CommandOrControl+alt+2', { command: 'heading2' })
    config.addKeyboardShortcut('CommandOrControl+alt+3', { command: 'heading3' })
    ```
  - Toolbars, overlays, context menus are now configured explicitly via `config.addToolPane`

    ```
    config.addToolPanel('main-overlay', [
      {
        type: 'tool-group',
        commandGroups: ['prompt']
      }
    ])

    config.addToolPanel('main-toolbar', [
      {
        name: 'text-types',
        type: 'tool-dropdown',
        showDisabled: true,
        style: 'descriptive',
        commandGroups: ['text-types']
      },
      {
        name: 'annotations',
        type: 'tool-group',
        showDisabled: true,
        style: 'minimal',
        commandGroups: ['annotations']
      },
      {
        name: 'insert',
        type: 'tool-group',
        showDisabled: true,
        style: 'minimal',
        commandGroups: ['insert']
      }
    ])
    ```

  - When no tool component is registered (`config.addTool`) for a command, `ToggleTool` is used.

- DEPRECATIONS:
  - `DocumentChange.isAffected()`: Use `DocumentChange.hasUpdated()` instead

## Beta 6

- Advanced drag & drop gestures for adding and moving content
- Spell checking support
- Tables
- Lists
- Introduced generalized concept for overlays
- New imperative editing API
- Overhauled `IsolatedNode` implementation
- Improved ES6 module bundling
- Stabilized Beta 5 features

## Beta 5

- Substance is now written in ES6
- More usage options: Use Substance via `<script>` tag or use a module bundler of your choice (Rollup, Browserify, Webpack, ...)
- Pure CSS instead of SASS for easier integration
- Extracted development environment into substance-bundler tool.
- Extracted test environment into substance-test
- Extracted API docs generator into substance-docgen
- Improved Tool API: Simplified command and tool APIs.
- Commands are now stateless and can be parametrized in the configurator
- Added tool targets: Determines where a tool gets rendered (e.g. in the toolbar or in an overlay)
- Gutter support for ScrollPane: Render tools in a gutter, vertically aligned with the current selection
- Removed experimental list and table packages: They will come back to core as soon as they are completed
- Stabilized Beta 4 features

## Beta 4

- Added support for realtime collaboration
- Added persistence interfaces to store versions and snaphots on the server
- Added a package system to provide a simple plugin mechanism
- Introduced the concept of an `IsolatedNode` enabling arbitrary complex editors and external components (such code editors)
- Optimized rendering engine
- Enabled server side rendering
- Added support for text macros
- Added `IconProvider` to generalize icon usage and make them configurable in packages
- Added `LabelProvider` for configurable multi language support
- Improved `ProseEditor` that can be extended through packages
- Improved `Component` API, with first-class debugging support
- Generalized commands and tools
- Added first version of tables and lists
- Improved XML/HTML import/export API
- Ported test suite from `QUnit` over to `tape`
- Fixed hundreds of issues and bugs
- Improved cross-browser compatibility
- Added many examples documenting core features
- Removed jQuery dependency

## Beta 3

- Added a Router implementation that can serialize component states to hash fragments
- Added ui/ScrollPane Component used to wrap any content and make it scrollable within a container (1ae97f9)
- Added ui/TOC as an interface for custom Table of Contents implementations (1ae97f9)
- Added util/server for easier development (7e12ae7)
- Added TabbedPane component (105e80d)
- Added SplitPane component (105e80d)
- Fixed a bug where Firefox ignored input events (e3d6173)
- Fixed an issue in ui/Component where owner and parent were confused (085a695)
- Fixed numerous issues related to mapping DOM selections to model selections
- Fixed a bug where nodes that have no addressable text property could not be rendered
- Fixed an edge case where triple clicking inside a paragraph with inline nodes did not led to an undesired selection
- Fixed an issue where focusedSurface is set too late on the controller
- Fixed an issue where an image wrapped in a selection was not deleted
- Fixed an bug where selection was mapped incorrectly at the end of the paragraph (76eab1f)
- Fixed several converter issues related to XML parsing and serializing (#391)
- Improved API documentation
- Fixed an issue where typing over an inline node did not remove it
- Added ui/Highlights class for distributed management of highlights
- Removed ui/ContentPanel in favor of an improved ScrollPane implementation
- Improved Clipboard: Copy and pasting between browsers now works seamlessly
- ScrollPane is now aware of TOC instances (when provided)

## Beta 2

- Simplified Node API: Props are now stored on the node directly
- New source directory and file layout optimized for deep-requiring individual classes
- New DOMElement API for interacting with DOM elements
- Improved Converter API: Now independent from the Article class
- Overhauled API for Tools: Logic now lives in Command implementations that are independent from the UI
- Editors are now Components implementing the Surface API
- CSS overhaul: improved modularity, prefixing to avoid collisions
- New predefined node types: Embed, Superscript, Subscript, Code.
- Removed FormEditor interface in favour of more fine-grained control using new TextPropertyEditor component
- API docs provided via new Substance DocumentationReader

## Beta 1

Initial release
