import { module } from 'substance-test'
import ContainerAddress from '../model/ContainerAddress'

const test = module('ContainerAddress')

test("[0,1] is before [1,0]", function(t) {
  var first = new ContainerAddress(0, 1)
  var second = new ContainerAddress(1, 0)
  t.ok(first.isBefore(second, 'strict'))
  t.ok(first.isBefore(second))
  t.end()
})

test("[1,0] is not before [0,1]", function(t) {
  var first = new ContainerAddress(1, 0)
  var second = new ContainerAddress(0, 1)
  t.notOk(first.isBefore(second, 'strict'))
  t.notOk(first.isBefore(second))
  t.end()
})

test("[0,0] is before [0,1]", function(t) {
  var first = new ContainerAddress(0, 0)
  var second = new ContainerAddress(0, 1)
  t.ok(first.isBefore(second, 'strict'))
  t.ok(first.isBefore(second))
  t.end()
})

test("[0,1] is not before [0,0]", function(t) {
  var first = new ContainerAddress(0, 1)
  var second = new ContainerAddress(0, 0)
  t.notOk(first.isBefore(second, 'strict'))
  t.notOk(first.isBefore(second))
  t.end()
})

test("[0,1] is not-strictly before [0,1]", function(t) {
  var first = new ContainerAddress(0, 1)
  var second = new ContainerAddress(0, 1)
  t.notOk(first.isBefore(second, 'strict'))
  t.ok(first.isBefore(second))
  t.end()
})

test("[0,1] is equal to [0,1]", function(t) {
  var first = new ContainerAddress(0, 1)
  var second = new ContainerAddress(0, 1)
  t.ok(first.isEqual(second))
  t.end()
})
