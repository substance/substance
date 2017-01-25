# Specification for the Editing Behavior

This document is used to maintain a specification for document editing in Substance.

There is a set of predefined high-level manipulations which work in a 'turtle-graphic' style. I.e., first the editor
is put into a specific state by setting a selection, and then a chain of manipulations can be
applied leading to a defined state in terms of content and selection.

Higher-level manipulations are:

- insert text
- insert inline node
- insert block node
- delete
- break

In addition to the higher level operations, still the low-level API can be used (`create`, `delete`, `set`, `update`).


## Inserting Text

- [IT1]: Cursor within a TextProperty

  ```
  abc|def ---> abcxxx|def

  ```

- [IT2]: Cursor within TextProperty inside annotation

  ```
  abc*d|e*f ---> abc*dxxx|e*f
  ```

- [IT3]: Cursor within TextProperty at the start of an annotation

  ```
  abc|*de*f ---> abcxxx|*de*f
  ```

  > Note: the text is inserted before the annotation, thus it is *not* annotated

- [IT4]: Cursor within TextProperty at the end of an annotation

  ```
  abc*de|*f ---> abc*dexxx|*f
  ```

  > Note: the text is appended to the annotated text, thus it *is* annotated

- [IT5]: Range within TextProperty

  ```
  ab>cde<f ---> abxxx|f
  ```

- [IT6]: Range within TextProperty overlapping an annotion aligned at the left side

  ```
  abc>*de<f* ---> abc*xxxf*|
  ```

  > Note: this is treated like replacing the annotated text, thus the inserted text *is* annotated

- [IT7]: Range within TextProperty inside an annotion

  ```
  abc*>de<*f ---> abc*xxx|*f
  ```

  > Note: this is treated like replacing parts of annotated text, thus the inserted text *is* annotated

- [IT8]: Range within TextProperty starting inside an annotion

  ```
  abc*d>e*f< ---> abc*dxxx|*
  ```

  > Note: this is treated like replacing parts of annotated text, thus the inserted text *is* annotated

- [IT9]: Range within TextProperty starting before an annotion reaching inside the annotation

  ```
  ab>c*d<ef* ---> abxxx|*ef*
  ```

  > Note: this is treated like replacing parts of the text before the annotation, thus the inserted text is *not* annotated

- [IT20]: NodeSelection

  `break` and `insert`

- [IT30]: Collapsed ContainerSelection

  Treat like PropertySelection or NodeSelection depending on the coordinate

- [IT31]: Range within one custom node

  Defined by node specific editing behavior

- [IT40]: Range (all other cases)

  `delete` and `insert`


## Inserting an InlineNode

This is the same as inserting text. InlineNodes are actually implemented by inserting a single character (such as `$`) and attaching an annotation to it.


## Inserting a BlockNode

In all cases, if inserting is allowed, the cursor is set
- at the end of the text if the inserted node is a TextNode (PropertySelection),
- otherwise the cursor is set after the inserted node (NodeSelection)


- [IB1]: Cursor in TextProperty not part of a ContainerEditor

  Nothing.

  > Maybe this should insert a `<br>` or `\n`?

- [IB2]: Cursor at start of a TextNode within a Container

  Insert node before text node.

- [IB3]: Cursor at end of a TextNode within a Container

  Insert node after text node.

- [IB4]: Cursor inside an empty TextNode within a Container

  Replace text node.

- [IB5]: Cursor in the middle of a non-empty TextNode within a Container

  `break` and insert after (first) text node.

- [IB10]: NodeSelection before

  Insert node before selected node.

- [IB11]: NodeSelection after

  Insert node after selected node.

- [IB11]: NodeSelection full

  Replace node.

- [IB20]: Range (all other cases)

  `break` and `insert`

  > Note: this case is reduced to one of the previous cases using a `break`.


## Delete

With direction `right`:

- [DR1]: Cursor at the end of a TextProperty not part of a Container

  Nothing.

- [DR2]: Cursor at the end of a TextNode at the end of a Container

  Nothing.

- [DR3]: Cursor in the middle of a TextProperty/TextNode

  Delete one character.

- [DR4]: Cursor inside an empty TextNode with successors

  Delete text node and put cursor before next node.
  TODO: define exact behavior for different types of successors

- [DR5]: Cursor at the end of a non-empty TextNode with successors within a Container

  Merge with next.
  TODO: define exact behavior for different types of successors

- [DR10]: NodeSelection before TextNode

  Set cursor at first character, then `delete`

  TODO: these cases should be normalized, i.e. there should
  be only one way to represent the cursor before a TextNode
  (-> property selection)
  Collapsed NodeSelections are only needed for IsolatedNodes.

- [DR11]: NodeSelection before isolated node

  Select the node.

- [DR14]: NodeSelection after IsolatedNode at the end of document

  Nothing.

- [DR15]: NodeSelection after a TextNode with successors

  Put the cursor at end of text then `delete`.
  TODO: normalize

- [DR16]: NodeSelection after other node with TextNode as successor

  Put the cursor at start of text then `delete left`.

- [DR17]: NodeSelection after other node with other node as successor

  Try to merge the next node into the selected node (node specific), otherwise select the successor.


With direction `left`:

- [DL1]: Cursor at the start of a TextProperty not part of a Container

  Nothing.

- [DL2]: Cursor at the start of a TextNode at the top of a Container

  Nothing.

- [DL3]: Cursor in the middle of a TextProperty

  Delete previous character. Move cursor one character left.

- [DL4]: Cursor inside an empty TextNode with a TextNode as predecessor

  Delete text node and put cursor at the end of the previous text node.

- [DL5]: Cursor inside an empty TextNode with another node as predecessor

  Delete text node and put cursor after the previous node.

- [DL6]: Cursor at the start of a non-empty TextNode with a predecessor

  Merge with previous node.

- [DL13]: NodeSelection after isolated/custom node

  Select the node.

- [DL14]: NodeSelection before node at the top of Container

  Nothing.

- [DL16]: NodeSelection before other node with TextNode as predecessor

  Put the cursor at end of text then `delete right`.

- [DL17]: NodeSelection before other node with other node as predecessor

  Try to merge the nodes (node specific), otherwise select the predecessor.


Both directions:

- [D1]: Collapsed ContainerSelection

  Reduce selection to PropertySelection or NodeSelection, then `delete`.

- [D10]: NodeSelection full with successors

  Delete the node. Cursor before next.

- [D11]: NodeSelection full at the end of document

  Replace the node with a paragraph. Cursor in new paragraph.

- [D12]: NodeSelection before TextNode

  Set cursor at first character, then `delete`

- [D13]: NodeSelection after TextNode

  Set cursor at last character, then `delete`

- [D20]: Range that starts before node and ends after node

  Delete all selected nodes and insert a new paragraph. Cursor in new paragraph.

- [D21]: Range that starts after a node and ends before a node

  Delete all inner nodes and collapse the selection to start.

- [D22]: Range that starts after a node and ends after a node

  Delete all inner nodes and the end node and collapse the selection to start.

- [D23]: Range that starts before a node and ends before a node

  Delete all inner nodes and the start node and collapse the selection to end.


## Break

- [B1]: Cursor in TextProperty not part of a Container

  Nothing.

- [B2]: Cursor at start of a TextNode

  Insert a node of the same type before the text node. Leave the cursor in the original node.

- [B3]: Cursor at end of a TextNode

  Insert a paragraph after the text node. Put the cursor into the new paragraph.

- [B4]: Cursor inside of a non-empty TextNode

  Move the text into a new paragraph. Transfer annotations (possible split). Put cursor at the start of new paragraph.

- [B10]: Cursor before a TextNode

  Put cursor at start of TextNode, then `break`

- [B11]: Cursor after a TextNode

  Put cursor at end of TextNode, then `break`

- [B12]: Cursor before isolated node

  Insert paragraph before node. Leave cursor before isolated node

- [B13]: Cursor after isolated node

  Insert paragraph after node. Put cursor at start of new paragraph

- [B20]: Range

  `delete` then `break`

## List

- [L1]: Insert Text - Cursor inside of list item

  Same as [IT1] but with List Item.
