var glob = require('glob');
var path = require('path');
var each = require('lodash/each');
var QUnit = require('qunitjs');
var colors = require('colors');

global.QUnit = QUnit;

var files = glob.sync('**/*.test.js', {cwd: 'test-old'});
// var files = glob.sync('unit/ui/Component.test.js', {cwd: 'test'});
each(files, function(file) {
  require('./' + file);
});

// disable try-catch in iron-node which has window defined
if (typeof window !== 'undefined' && window.process) {
  QUnit.config.notrycatch = true;
}

var lastModule = null;
var lastTestName = null;
var count = 0;
var fails = 0;


QUnit.log(function(data) {
  count++;
  if (!data.result) {
    if (data.module !== lastModule) {
      console.log(data.module);
      lastModule = data.module;
    }
    if (data.name !== lastTestName) {
      console.log('  ' + data.name);
      lastTestName = data.name;
    }
    console.log('  - ', data.message || "", ' ', data.result ? 'ok' : 'failed');
    console.log('    expected: ', data.expected, '; actual: ', data.actual);
    console.log(data.source);
    // fails.push({
    //   module: data.module,
    //   name: data.name,
    //   msg: data.message || "",
    // })
    fails++;
    // console.log('#### log', data);
  }
});

QUnit.done(function(data) {
  if (fails > 0) {
    console.error('FAILED: %d tests of %d failed'.red, fails, count);
    process.exit(1);
  } else {
    console.log('YAY: %d tests passed'.green, count);
  }
});

console.log('');
console.log('#####################################'.yellow);
console.log('Running tests in node.js...'.yellow);
console.log('#####################################'.yellow);
console.log('');
QUnit.load();


