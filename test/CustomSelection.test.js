import { test } from 'substance-test'
import { CustomSelection } from 'substance'

test('CustomSelection: Creating a CustomSelection', t => {
  t.doesNotThrow(() => {
    new CustomSelection({ // eslint-disable-line no-new
      customType: 'test',
      data: { bar: 'baz' },
      nodeId: 'foo'
    })
  })
  t.throws(() => {
    new CustomSelection({ // eslint-disable-line no-new
      nodeId: 'foo'
    })
  }, /customType/, 'should throw if customType not given')
  t.throws(() => {
    new CustomSelection({ // eslint-disable-line no-new
      customType: 'test'
    })
  }, /nodeId/, 'should throw if nodeId not given')
  t.end()
})

test('CustomSelection: toJSON()', t => {
  let sel = new CustomSelection({
    customType: 'test',
    data: { bar: 'baz' },
    nodeId: 'foo'
  })
  t.deepEqual(sel.toJSON(), {
    type: 'custom',
    customType: 'test',
    data: { bar: 'baz' },
    nodeId: 'foo'
  }, 'toJSON() should provide correct result')
  t.end()
})
