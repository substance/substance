/*
  Validates if a given schema fulfills
  the requirements for generating an editor.

  @param {XMLSchema} xmlSchema

  In many cases, problems can be avoided by restricting the schema, removing
  ambiguities. Such restrictions lead to a schema which does not violate the original schema.
  Some problems demand changes to the structure, e.g. adding elements to
  an elements, which make the custom schema incompatible with the original one.

  For all customizations we should maintain transformations for importing documents
  from the original schema, in a loss-free manner. For the latter types of changes
  we also need transformations for exporting into the original format.

  Criteria:

  - `text`:
    - all expression alternatives must allow TEXT
    - example: `<p>`
  - `element`:
    - all expression alternatives are structured
    - example: `<abstract>`
  - `hybrid`:
    - mixture of `text` and `element`, i.e., some expression alternatives
    contain TEXT, some not
    - example: `<td>`
  - `annotation`:
    - an element that is used inside of `text` elements
    - all expression alternatives must allow TEXT
    - the content is not owned by this element
    - example: `<bold>`
  - `inline-element`:
    - an element that is used inside of `text` elements
    - content is owned by the element
    - example: `<chem-struct>`
  - `anchor`:
    - an empty element used inside of `text` elements only

  Possible Issues:

  1. `text` used inline, i.e. it can occur inside of a `text` element

  > Resolutions:
    - classify as `annotation`,
    - or remove from parent,
    - or transform parent into a `hybrid`

  2. `element` or `hybrid` used inline, i.e. it can occur inside of a `text` element

  > Resolutions:
    - classify as `inline-element`,
    - or remove from parent,
    - or transform parent into a `hybrid`

  3. `annotation`, `inline-element`, or `anchor` elements are used as structured content

  > Resolution:
    - remove element from structured parents

  4. `text` does not allow TEXT

  > Resolution:
    - classify as `element`, `inline-element`, or `anchor`

  5. `text` must not allow structured content (only text and inline content)

  > Resolutions:
    - disallow structured content
    - or classify as `element`, or `inline-element`

  6. `element` must not allow TEXT

  > Resolution:
    - disallow TEXT
    - or classify as `text` or `hybrid`

  7. `hybrid` must TEXT and structured content but not mixed

  > Resolution:
    - fix content specification
    - or classify as `text` or `element`

*/
export default function checkSchema (xmlSchema) {
  const tagNames = xmlSchema.getTagNames()
  let issues = []
  for (let i = 0; i < tagNames.length; i++) {
    const name = tagNames[i]
    const elementSchema = xmlSchema.getElementSchema(name)
    switch (elementSchema.type) {
      case 'text': {
        issues = issues.concat(_checkTextElement(elementSchema))
        break
      }
      case 'element':
      case 'container': {
        issues = issues.concat(_checkElement(elementSchema))
        break
      }
      case 'hybrid': {
        issues = issues.concat(_checkHybridElement(elementSchema))
        break
      }
      case 'annotation': {
        issues = issues.concat(_checkAnnotation(elementSchema))
        break
      }
      case 'inline-element': {
        issues = issues.concat(_checkInlineElement(elementSchema))
        break
      }
      case 'anchor': {
        issues = issues.concat(_checkAnchor(elementSchema))
        break
      }
      case 'external': {
        break
      }
      default:
        throw new Error('Unsupported element classification.')
    }
  }
  return issues
}

function _checkTextElement (elementSchema) {
  const issues = []
  // should not be used inline
  if (_usedInline(elementSchema)) {
    issues.push(`[1]: text element <${elementSchema.name}> is used inline by ${_usedInlineBy(elementSchema).join(',')}`)
  }
  // should have text
  if (!elementSchema.isText) {
    issues.push(`[4]: text element <${elementSchema.name}> does not allow text content`)
  }
  // should not have structured content
  if (elementSchema.isStructured) {
    issues.push(`[5]: text element <${elementSchema.name}> must not allow structured content`)
  }
  return issues
}

function _checkElement (elementSchema) {
  const issues = []
  if (_usedInline(elementSchema)) {
    issues.push(`[2]: element <${elementSchema.name}> is used inline by ${_usedInlineBy(elementSchema).join(',')}`)
  }
  // should not have text
  if (elementSchema.isText) {
    issues.push(`[6]: element <${elementSchema.name}> must not allow text content`)
  }
  return issues
}

function _checkHybridElement (elementSchema) {
  const issues = []
  if (_usedInlineOnly(elementSchema)) {
    issues.push(`[2.2]: hybrid element <${elementSchema.name}> is used inline by ${_usedInlineBy(elementSchema).join(',')}`)
  }
  // should have text
  if (!elementSchema.isText || !elementSchema.isStructured) {
    issues.push(`[7]: hybrid element <${elementSchema.name}> must allow text and structured content`)
  }
  return issues
}

function _checkAnnotation (elementSchema) {
  const issues = []
  // must not be used as structured content
  if (!_usedInlineOnly(elementSchema)) {
    issues.push(`[3]: annotation <${elementSchema.name}> is used in structured content by ${_usedStructuredBy(elementSchema).join(',')}`)
  }
  if (!elementSchema.isText) {
    issues.push(`[8]: annotation <${elementSchema.name}> does not allow text content`)
  }
  // ATTENTION: as XML schemas are context-free, it is problematic
  // to define a schema for annotations. I.e., annotations should
  // 'inherit' all content allowed by its parent text element.
  // As this is a limitation of DTD, JATS contains some of these
  // inconsistencies, such as <journal-title> does not allow <break>,
  // but <bold> does.
  return issues
}

function _checkInlineElement (elementSchema) {
  const issues = []
  if (!_usedInlineOnly(elementSchema)) {
    issues.push(`[3]: inline-element <${elementSchema.name}> is used in structured content by ${_usedStructuredBy(elementSchema).join(',')}`)
  }
  return issues
}

function _checkAnchor (elementSchema) {
  const issues = []
  if (!_usedInlineOnly(elementSchema)) {
    issues.push(`[3]: anchor <${elementSchema.name}> is used in structured content by ${_usedStructuredBy(elementSchema).join(',')}`)
  }
  return issues
}

function _usedInline (elementSchema) {
  let usedInlineBy = elementSchema.usedInlineBy || {}
  return Object.keys(usedInlineBy).length > 0
}

function _usedInlineBy (elementSchema) {
  let usedInlineBy = elementSchema.usedInlineBy || {}
  return Object.keys(usedInlineBy)
}

function _usedInlineOnly (elementSchema) {
  let usedStructuredBy = _usedStructuredBy(elementSchema)
  return (usedStructuredBy.length === 0)
}

function _usedStructuredBy (elementSchema) {
  let usedInlineBy = elementSchema.usedInlineBy || {}
  let parents = Object.keys(elementSchema.parents)
  let usedStructuredBy = parents.filter((name) => {
    return !(usedInlineBy[name])
  })
  return usedStructuredBy
}
