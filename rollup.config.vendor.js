const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const json = require('rollup-plugin-json')

module.exports = ['boolbase', 'css-what', 'domelementtype', 'entities', 'nth-check', 'lodash-es'].map(name => {
  return {
    input: `vendor/_${name}.js`,
    output: {
      file: `vendor/${name}.js`,
      format: 'esm'
    },
    plugins: [
      nodeResolve(),
      commonjs({
        include: 'node_modules/**'
      }),
      json()
    ]
  }
}).concat([
  {
    input: 'vendor/_css-select.js',
    output: {
      file: 'vendor/css-select.js',
      format: 'esm'
    },
    external: [
      'boolbase', 'css-what', 'domutils', 'nth-check'
    ],
    plugins: [
      nodeResolve(),
      commonjs({
        include: ['vendor/css-select/**']
      }),
      json(),
      _patchCssSelect()
    ]
  },
  {
    input: 'vendor/_htmlparser2.js',
    output: {
      file: 'vendor/htmlparser2.js',
      format: 'esm'
    },
    external: [
      'events',
      'entities/lib/decode_codepoint.js',
      'entities/maps/entities.json',
      'entities/maps/legacy.json',
      'entities/maps/xml.json',
      'inherits'
    ],
    plugins: [
      nodeResolve(),
      commonjs({
        include: []
      }),
      json(),
      _patchHtmlparser2()
    ]
  }
])

function _patchCssSelect () {
  return {
    name: 'patch-css-select',
    generateBundle (options, bundle, isWrite) {
      const output = bundle['css-select.js']
      output.code = output.code.replace("'boolbase'", "'./boolbase'")
      output.code = output.code.replace("'css-what'", "'./css-what'")
      output.code = output.code.replace("'domutils'", "'../dom/domutils'")
      output.code = output.code.replace("'nth-check'", "'./nth-check'")
    }
  }
}

function _patchHtmlparser2 () {
  return {
    name: 'patch-domutils',
    generateBundle (options, bundle, isWrite) {
      const output = bundle['htmlparser2.js']
      output.code = output.code.replace("import decode_codepoint from 'entities/lib/decode_codepoint.js'", "import { decode_codepoint } from './entities'")
      output.code = output.code.replace("import entities from 'entities/maps/entities.json'", "import { entities } from './entities'")
      output.code = output.code.replace("import legacy from 'entities/maps/legacy.json'", "import { legacy } from './entities'")
      output.code = output.code.replace("import xml from 'entities/maps/xml.json'", "import { xml } from './entities'")
      output.code = output.code.replace("import inherits from 'inherits'", "import inherits from './inherits'")
      output.code = output.code.replace("import events from 'events'", "import events from './events'")
    }
  }
}
