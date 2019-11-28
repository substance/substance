import hasOwnProperty from './hasOwnProperty'

export default function createCountingIdGenerator () {
  var counters = {}
  return function uuid (prefix) {
    if (!hasOwnProperty(counters, prefix)) {
      counters[prefix] = 1
    }
    var result = [prefix, '-', counters[prefix]++].join('')
    return result
  }
}
