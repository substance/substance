import { module } from 'substance-test'
import { compileRNG, DefaultDOMElement, validateXMLSchema } from 'substance'

const test = module('XMLSchema')

test('Sequence', (t) => {
  const RNG = `
    <grammar>
      <define name="a">
        <element name="a">
        </element>
      </define>
      <define name="b">
        <element name="b">
        </element>
      </define>
      <define name="c">
        <element name="c">
        </element>
      </define>
      <define name="foo">
        <element name="foo">
          <ref name="a"/>
          <ref name="b"/>
          <ref name="c"/>
        </element>
      </define>
      <start>
        <ref name="foo"/>
      </start>
    </grammar>
  `
  let xmlSchema = _compileRNG(RNG, 'foo')
  let doc, result

  doc = DefaultDOMElement.parseXML(`
    <foo>
      <a/>
      <b/>
      <c/>
    </foo>
  `)
  result = validateXMLSchema(xmlSchema, doc)
  t.ok(result.ok, '(a,b,c) should be valid')

  doc = DefaultDOMElement.parseXML(`
    <foo>
      <a/>
      <c/>
    </foo>
  `)
  result = validateXMLSchema(xmlSchema, doc)
  t.notOk(result.ok, '(a,c) should not be valid')

  t.end()
})

test('Interleaving', (t) => {
  const RNG = `
    <grammar>
      <define name="a">
        <element name="a">
        </element>
      </define>
      <define name="b">
        <element name="b">
        </element>
      </define>
      <define name="c">
        <element name="c">
        </element>
      </define>
      <define name="foo">
        <element name="foo">
          <interleave>
            <ref name="a"/>
            <ref name="b"/>
            <ref name="c"/>
          </interleave>
        </element>
      </define>
    </grammar>
  `
  let xmlSchema = _compileRNG(RNG, 'foo')
  let doc, result
  doc = DefaultDOMElement.parseXML(`
    <foo>
      <a/>
      <b/>
      <c/>
    </foo>
  `)
  result = validateXMLSchema(xmlSchema, doc)
  t.ok(result.ok, '(a,b,c) should be valid')

  doc = DefaultDOMElement.parseXML(`
    <foo>
      <a/>
      <c/>
      <b/>
    </foo>
  `)
  result = validateXMLSchema(xmlSchema, doc)
  t.ok(result.ok, '(a,c,b) should be valid, too')

  doc = DefaultDOMElement.parseXML(`
    <foo>
      <a/>
      <b/>
    </foo>
  `)
  result = validateXMLSchema(xmlSchema, doc)
  t.notOk(result.ok, 'but (a,b) should not be valid')

  t.end()
})

function _compileRNG(rng, startElement) {
  let xmlSchema = compileRNG(rng)
  xmlSchema.getStartElement = function() { return startElement }
  return xmlSchema
}