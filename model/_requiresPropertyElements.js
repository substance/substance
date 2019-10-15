export default function _requiresPropertyElements (nodeSpec) {
  return ((nodeSpec.parentType === '@node' && !nodeSpec.options.omitPropertyElement) || nodeSpec.childPropertyCount > 1)
}
