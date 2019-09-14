export default function getClassName (obj) {
  const ctor = obj.constructor || obj
  return ctor.displayName || ctor.name
}
