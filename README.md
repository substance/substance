# Substance [![Build Status](https://travis-ci.org/substance/substance.svg?branch=devel)](https://travis-ci.org/substance/substance)

Substance is a JavaScript library for web-based content editing. It provides building blocks for realizing custom text editors and web-based publishing systems.

Check the [project website](http://substance.io) and the [example editor](https://github.com/substance/example-editor).

## Features

Features                                                                    | State
--------------------------------------------------------------------------- | :------------:
Custom document schemas                                                     | ✓
Custom converters (XML, HTML, etc.)                                         | ✓
Custom HTML Rendering                                                       | ✓
Drag & Drop Support                                                         | Beta
Annotations can hold information (e.g. a comment)                           | ✓
Multiple Editing Surfaces (e.g. title + abstract + body )                   | ✓
Isolated Nodes (any content with any custom UI)                             | ✓
Incremental document updates (undoable operations)                          | ✓
Transformations for document manipulation                                   | ✓
Custom editing toolbars and overlays                                        | ✓
Commands for controlling the editor                                         | ✓
Multi-language support                                                      | ✓
Realtime collaboration                                                      | Beta
Text Macros                                                                 | ✓
Key bindings                                                                | ✓
Packages (aka Plugins)                                                      | ✓
**UI Components**                                                           |
TextPropertyEditor for editing annotated text                               | ✓
ContainerEditor for in-flow-editing                                         | ✓
ScrollPane with interactive visual Scrollbar                                | ✓
**Platform support**                                                        |
Mozilla Firefox (>=49)                                                      | Beta
Apple Safari (>=10)                                                         | ✓
Google Chrome (>=53)                                                        | ✓
Microsoft Edge                                                              | Beta


## Development

Install the dev dependencies.

```
npm install
```

Run the dev server.

```
npm start
```

Navigate to `http://localhost:5550/test` for the running the browser test suite. The test suite is rebuilt as you make changes to the source files.

To run the test-suite headless.

```
$ npm test
```
