import { module } from 'substance-test'
import { DOMImporter } from 'substance'
import getTestConfig from './fixture/getTestConfig'

const test = module('DOMImporter')

test("creating a DOMImporter", (t) => {
  const config = getTestConfig()
  const schema = config.getSchema()

  // without converters
  t.throws(() => {
    new DOMImporter({ schema })
  }, 'should throw if no converters are given')
  // without DocumentClass
  t.throws(() => {
    new DOMImporter({ converters: [] })
  }, 'should throw if schema is not given')
  t.end()
})
