# Substance [![Build Status](https://travis-ci.org/substance/substance.svg?branch=master)](https://travis-ci.org/substance/substance)

Substance is a JavaScript library for web-based content editing. It provides building blocks for realizing custom text editors and web-based publishing systems.

Check the [project website](http://substance.io) the [documentation](http://substance.io/docs) and the [official demos](http://substance.io/demos).

## Features

Features                                                                    | State
--------------------------------------------------------------------------- | :------------:
Custom document schemas                                                     | ✓
Custom converters (XML, HTML, etc.)                                         | ✓
Custom HTML Rendering                                                       | ✓
Annotations that can span over multiple nodes                               | ✓
Annotations can hold information (e.g. a comment)                           | ✓
Incremental document updates (undoable operations)                          | ✓
Transformations for document manipulation                                   | ✓
Custom editing toolbars                                                     | ✓
Commands for controlling the editor                                         | Beta 2
Key bindings                                                                | Beta 3
I18N support                                                                | Beta 2
Realtime collaboration                                                      | Beta 3
Full Unicode support                                                        | Beta 3
Plugins                                                                     | Beta 3
Persistence API for documents                                               | Beta 4
                                                                            |
**UI Widgets**                                                              |
Ready-to-use [Editor](http://substance.io/demos/prose-editor)               | ✓
Writer interface for building full-fledged custom editing apps              | Beta 2
                                                                            |
**Predefined content types**                                                |
Paragraph                                                                   | ✓
Heading                                                                     | ✓
Blockquote                                                                  | ✓
Codeblock                                                                   | ✓
Resource (image, video, tweet etc.)                                         | Beta 2
List                                                                        | Beta 2
Table                                                                       | Beta 3
Figure (including upload)                                                   | Beta 4
                                                                            |
**Predefined annotation types**                                             |
Strong                                                                      | ✓
Emphasis                                                                    | ✓
Link                                                                        | ✓
Subscript                                                                   | Beta 2
Superscript                                                                 | Beta 2
Comment                                                                     | Beta 3


## Development

### Testing

1. Running the test-suite headless (using Phantom.js)

```
$ npm test
```

2. Running the test-suite in a browser for debugging:

```
$ npm start
```

Then open http://localhost:4201/test in your browser.

3. Creating a test coverage report.

```
$ npm run coverage
```

The report is stored in the `coverage` folder.


## Roadmap

### Beta 2

*ETA: November 15 2015*

- Support for nested nodes
- Commands for controlling the editor
- Editing of lists
- Resource node type (image, video, tweet etc.)
- CSS modularization: one css file per UI component
- Automatically published API docs
- Writer interface for building full-fledged custom editing apps
- Improved stability, documentation and tests
- I18n

### Beta 3

- Automatically generated performance report
- Table node
- Novel Writer demo
- Key bindings
- Plugins
- Realtime collaboration
- Improved Unicode support
- Improved stability, documentation and tests

### Beta 4

- Modules for server-side integration
  - Persistence API for documents
  - Figure upload
- Server-side realtime collaboration infrastructure
- Full-stack platform example

### 1.0 Final

- Complete documentation
- Full test coverage
- Final versions of API's
