module.exports = function (_module) {
  const path = require('path')
  // create the ESM loader first
  const _require = require('esm')(_module)
  // and let 'module-alias' register on top of the ESM loaded
  const moduleAlias = _require('module-alias')
  const substanceEntryPoint = path.join(__dirname, '..', 'index.es.js')
  moduleAlias.addAlias('substance', substanceEntryPoint)
  // register the alias module loaded
  moduleAlias()
  return _require
}
