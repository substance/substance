export default function getComponentForNode (comp, node) {
  const componentRegistry = comp.context.componentRegistry
  let ComponentClass = componentRegistry.get(node.type)
  if (!ComponentClass) {
    const superTypes = node.getSchema().getSuperTypes()
    for (const superType of superTypes) {
      ComponentClass = componentRegistry.get(superType)
      if (ComponentClass) break
    }
  }
  if (!ComponentClass) {
    throw new Error(`No Component class registered for model type ${node.type}.`)
  }
  return ComponentClass
}
