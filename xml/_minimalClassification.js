import analyzeSchema from './analyzeSchema'

export default function _minimalClassification(xmlSchema, classification) {
  analyzeSchema(xmlSchema)
  const tagNames = xmlSchema.getTagNames()
  const result = {}
  tagNames.sort()
  for (let i = 0; i < tagNames.length; i++) {
    const tagName = tagNames[i]
    const elSchema = xmlSchema.getElementSchema(tagName)
    if (elSchema.type !== classification[tagName]) {
      result[tagName] = classification[tagName]
    }
  }
  return JSON.stringify(result, 0, 2)
}