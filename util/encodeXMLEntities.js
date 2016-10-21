/*
  Escape XML Entities

  HACK: this is just a cheap implementation to escape XML entities
*/
function encodeXMLEntities(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default encodeXMLEntities
