import encode from 'entities/lib/encode'
import decodeCodepoint from 'entities/lib/decode_codepoint.js'
import entitiesJSON from 'entities/maps/entities.json'
import legacyJSON from 'entities/maps/legacy.json'
import xmlJSON from 'entities/maps/xml.json'

export default {
  encodeXML: encode.XML,
  decodeCodepoint,
  entitiesJSON,
  legacyJSON,
  xmlJSON
}
