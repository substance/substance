export default function _requiresPropertyElements (nodeSpec) {
  return (
    // NOTE: '@node' means 'structured node' as opposed to '@text' for instance
    (nodeSpec.parentType === '@node' && !nodeSpec.options.omitPropertyElement) ||
    nodeSpec.childPropertyCount > 1
  )
}
