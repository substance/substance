import encode from 'entities/lib/encode'
import decode_codepoint from 'entities/lib/decode_codepoint.js'
import entities from 'entities/maps/entities.json'
import legacy from 'entities/maps/legacy.json'
import xml from 'entities/maps/xml.json'

const encodeXML = encode.XML

export {
  decode_codepoint,
  entities,
  legacy,
  xml,
  encodeXML
}
