function isObject(val) {
  const type = typeof val
  return Boolean(val) && (type === 'object' || type === 'function')
}

export default isObject