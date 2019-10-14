import SchemaDefinition from './_SchemaDefinition'
import { CHILDREN_PROPERTY_TYPES } from './_SchemaConstants'

export default function createDefinition (version, actions) {
  const definition = new SchemaDefinition()
  for (const action of actions) {
    definition.apply(action)
    if (definition.version > version) break
  }
  definition.version = version
  // compute childPropertyCount for every node spec
  for (const nodeSpec of definition.nodes.values()) {
    const childPropertyNames = []
    for (const [propName, propSpec] of nodeSpec.properties) {
      if (CHILDREN_PROPERTY_TYPES.has(propSpec.type)) {
        childPropertyNames.push(propName)
      }
    }
    nodeSpec.childPropertyNames = childPropertyNames
    nodeSpec.childPropertyCount = childPropertyNames.length
  }

  return definition
}
