import { module } from 'substance-test'
import flattenOften from '../../util/flattenOften'

const test = module('utils')

test('flattenOften should flatten multiple rounds', (t) => {
  let arr = [1, [2, 3, [4, 5]]]
  let result = flattenOften(arr, 2)
  t.deepEqual([1, 2, 3, 4, 5], result, 'array should be flattened.')
  t.end()
})

test('flattenOften should stop at max', (t) => {
  let arr = [1, [2, 3, [4, 5]]]
  let result = flattenOften(arr, 1)
  t.deepEqual([1, 2, 3, [4, 5]], result, 'array should be flattened only once.')
  t.end()
})
