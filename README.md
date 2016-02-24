# Substance [![Build Status](https://travis-ci.org/substance/substance.svg?branch=master)](https://travis-ci.org/substance/substance)

Substance is a JavaScript library for web-based content editing. It provides building blocks for realizing custom text editors and web-based publishing systems.

Check the [project website](http://substance.io), the [examples](https://github.com/substance/examples) and the [API documentation](http://substance.io/docs).

*Substance Beta 4 introduces support for realtime collaboration. While still under development, you can already check out and run our full-stack collaborative [Notepad](https://github.com/substance/notepad) application.*

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
Commands for controlling the editor                                         | ✓
I18N support                                                                | ✓
Realtime collaboration                                                      | Beta 4
Persistence API for documents                                               | Beta 4
Key bindings                                                                | Beta 5
Full Unicode support                                                        | Beta 5
Plugins                                                                     | Beta 5
                                                                            |
**UI Components**                                                           |
TextPropertyEditor for editing annotated text                               | ✓
ContainerEditor for in-flow-editing                                         | ✓
Scrollable ContentPanel with Support for highlights                         | ✓
Customizable Toolbar                                                        | ✓
ScrollPane with interactive visual Scrollbar                                | ✓
Interactive TOCPanel                                                        | ✓
                                                                            |
**Predefined content types**                                                |
Paragraph                                                                   | ✓
Heading                                                                     | ✓
Blockquote                                                                  | ✓
Codeblock                                                                   | ✓
Image                                                                       | ✓
Embed (image, video, tweet etc.)                                            | ✓
List                                                                        | Beta 4
Table                                                                       | Beta 4
                                                                            |
**Predefined annotation types**                                             |
Strong                                                                      | ✓
Emphasis                                                                    | ✓
Link                                                                        | ✓
Subscript                                                                   | ✓
Superscript                                                                 | ✓
Code                                                                        | ✓
Comment                                                                     | Beta 4
                                                                            |
**Platform support**                                                        |
Mozilla Firefox (>=42)                                                      | ✓
Apple Safari (>=9)                                                          | ✓
Google Chrome (>=47)                                                        | ✓
Microsoft Edge                                                              | ✓
Mobile Safari (iOS)                                                         | Beta 5
Mobile Chrome (Android)                                                     | Beta 5

## Development

Install the dev dependencies.

```
npm install
```

Run the dev server.

```
npm start
```

Navigate to `http://localhost:4201/docs` for the docs and `http://localhost:4201/test` for the test suite.

To run the test-suite headless

```
$ npm test
```

To create a test coverate report:

```
$ npm run coverage
```

The report is stored in the `coverage` folder.

To bundle the docs into a distribution:

```
$ npm run doc
```

## Roadmap

### Beta 4

*ETA: March 2016*

- Realtime collaboration
- Persistence API for documents
- Table node
- Editing of lists
- Improved stability, documentation and tests
- Full-stack platform example

### Beta 5

- Key bindings
- Plugins
- Improved Unicode support
- Mobile support
- Automatically generated performance report
- Modules for server-side integration

### 1.0 Final

- Complete documentation
- Full test coverage
- Final versions of API's
