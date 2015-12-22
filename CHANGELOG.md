## Beta 3

- Added a Router implementation that can serialize component states to hash fragments
- Added ui/ScrollPane Component used to wrap any content and make it scrollable within a container (1ae97f9)
- Added ui/TOC as an interface for custom Table of Contents implementations (1ae97f9)
- Added util/server for easier development (7e12ae7)
- Added TabbedPane component (105e80d)
- Added SplitPane component (105e80d)
- Fixed a bug where Firefox ignored input events (e3d6173)
- Fixed an issue in ui/Component where owner and parent were confused (085a695)
- Fixed numerous issues related to mapping DOM selections to model selections.
- Fixed a bug where nodes that have no addressable text property could not be rendered
- Fixed an edge case where triple clicking inside a paragraph with inline nodes did not led to an undesired selection.

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
