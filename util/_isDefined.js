export default function _isDefined (val) {
  if (val) return true
  else return typeof val !== 'undefined'
}
