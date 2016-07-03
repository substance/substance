# Substance [![Build Status](https://travis-ci.org/substance/substance.svg?branch=devel)](https://travis-ci.org/substance/substance)

Substance is a JavaScript library for web-based content editing. It provides building blocks for realizing custom text editors and web-based publishing systems.

Read the [introduction post](https://medium.com/@_mql/build-your-own-editor-with-substance-7790eb600109), check the [project website](http://substance.io), the [examples](https://github.com/substance/examples) and the [API documentation](http://substance.io/docs).

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
Multi-language support                                                      | ✓
Realtime collaboration                                                      | ✓
Persistence API for documents                                               | ✓
Text Macros                                                                 | ✓
Key bindings                                                                | Beta 5
Full Unicode support                                                        | Beta 5
Packages (aka Plugins)                                                      | ✓
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
List                                                                        | ✓
Table                                                                       | ✓
                                                                            |
**Predefined annotation types**                                             |
Strong                                                                      | ✓
Emphasis                                                                    | ✓
Link                                                                        | ✓
Subscript                                                                   | ✓
Superscript                                                                 | ✓
Code                                                                        | ✓
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

To bundle the docs into a distribution:

```
$ npm run doc
```

## Roadmap

### Beta 5

*ETA: July 2016*

- Key bindings
- Mobile support
- Improved Unicode support
- Advanced list support
- Advanced table support

*ETA: Fall 2016*

### 1.0 Final

- Complete documentation
- Full test coverage (Current Coverage Status: [![Current Coverage Status](https://coveralls.io/repos/github/substance/substance/badge.svg?branch=devel)](https://coveralls.io/github/substance/substance?branch=devel))
- Final versions of API's
