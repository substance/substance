import forEach from '../../util/forEach'
import isPlainObject from '../../util/isPlainObject'
import isArray from '../../util/isArray'
import isObject from '../../util/isObject'

export default function checkValues(t, actual, expected) {
  if (!isObject(actual)) {
    t.fail('Provided object is invalid: actual=' + String(actual))
    return
  }
  forEach(expected, (expectedVal, key) => {
    if (isPlainObject(expectedVal) || isArray(expectedVal)) {
      t.deepEqual(actual[key], expectedVal, key + ' should be correct')
    } else {
      t.equal(actual[key], expectedVal, key + ' should be correct')
    }
  })
}