export default function getKeyForPath (path) {
  if (path._key === undefined) {
    Object.defineProperty(path, '_key', {
      value: path.join('.'),
      writable: false,
      enumerable: false
    })
  }
  return path._key
}
