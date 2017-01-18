import isString from './isString'

export default function startsWith(str, prefix) {
  if (str.startsWith) return str.startsWith(prefix)
  if (!isString(prefix)) prefix = String(prefix)
  return str.slice(0, prefix.length) === prefix
}