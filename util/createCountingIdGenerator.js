export default function createCountingIdGenerator() {
  var counters = {}
  return function uuid(prefix) {
    if (!counters.hasOwnProperty(prefix)) {
      counters[prefix] = 1
    }
    var result = [prefix, '-', counters[prefix]++].join('')
    return result
  }
}
