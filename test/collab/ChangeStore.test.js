'use strict';

var ChangeStore = require('../../collab/ChangeStore');
var testChangeStore = require('./testChangeStore');
var changeStoreSeed = require('../fixtures/changeStoreSeed');
var changeStore = new ChangeStore();

var test = require('../test').module('collab/ChangeStore');

function setup(cb, t) {
  // Make sure we create a new seed instance, as data ops
  // are performed directly on the seed object
  var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed));
  changeStore.seed(newChangeStoreSeed, function(err) {
    if (err) console.error(err);
    else cb(t);
  });
}

function setupTest(description, fn) {
  test(description, function (t) {
    setup(fn, t);
  });
}

// Runs the offical backend test suite
testChangeStore(changeStore, setupTest);