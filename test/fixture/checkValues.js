import forEach from '../../util/forEach'

export default function checkValues(t, actual, expected) {
  forEach(expected, (expectedVal, key) => {
    t.equal(actual[key], expectedVal, key + ' should be correct')
  })
}