# Substance [![Build Status](https://travis-ci.org/substance/substance.svg?branch=devel)](https://travis-ci.org/substance/substance)

Substance is a JavaScript library for web-based content editing. It provides building blocks for realizing custom text editors and web-based publishing systems.

Read the [introduction post](https://medium.com/@_mql/build-your-own-editor-with-substance-7790eb600109), check the [project website](http://substance.io), the [examples](https://github.com/substance/examples) and the [API documentation](http://substance.io/docs).

## Features

Features                                                                    | State
--------------------------------------------------------------------------- | :------------:
Custom document schemas                                                     | ✓
Custom converters (XML, HTML, etc.)                                         | ✓
Custom HTML Rendering                                                       | ✓
Annotations can hold information (e.g. a comment)                           | ✓
Annotations that can span over multiple nodes                               | Beta 6
Isolated Nodes (any content with any custom UI)                             | ✓
Incremental document updates (undoable operations)                          | ✓
Transformations for document manipulation                                   | ✓
Custom editing toolbars                                                     | ✓
Commands for controlling the editor                                         | ✓
Multi-language support                                                      | ✓
Realtime collaboration                                                      | ✓
Persistence API for documents                                               | ✓
Text Macros                                                                 | ✓
Key bindings                                                                | Beta 6
Full Unicode support                                                        | Beta 6
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
List                                                                        | Beta 6
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
Mozilla Firefox (>=49)                                                      | ✓
Apple Safari (>=10)                                                         | ✓
Google Chrome (>=53)                                                        | ✓
Microsoft Edge                                                              | ✓


## Development

Install the dev dependencies.

```
npm install
```

Run the dev server.

```
npm start
```

Navigate to `http://localhost:5550/docs` for the docs and `http://localhost:5550/test` for the test suite. Test suite and docs are rebuilt as you make changes to the source files.

If you only work on the documentation, this recompiles faster.

```
npm run docs
```

To run the test-suite headless.

```
$ npm test
```

## Roadmap

### Beta 6

*ETA: November 2016*

- Key bindings
- Improved Unicode support
- List package

### 1.0 Final

- Complete documentation
- Full test coverage (Current Coverage Status: [![Current Coverage Status](https://coveralls.io/repos/github/substance/substance/badge.svg?branch=develop)](https://coveralls.io/github/substance/substance?branch=develop))
- Final versions of API's
