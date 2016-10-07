import { module } from 'substance-test'

import DocumentStore from '../../collab/DocumentStore'
import ChangeStore from '../../collab/ChangeStore'
import DocumentEngine from '../../collab/DocumentEngine'
import testDocumentEngine from '../collab/testDocumentEngine'

import Configurator from '../../util/Configurator'
import TestArticle from './TestArticle'
import TestMetaNode from './TestMetaNode'

import documentStoreSeed from '../fixtures/documentStoreSeed'
import changeStoreSeed from '../fixtures/changeStoreSeed'

const test = module('model/DocumentEngine')

var configurator = new Configurator()
configurator.defineSchema({
  name: 'prose-article',
  ArticleClass: TestArticle,
  defaultTextType: 'paragraph'
})
configurator.addNode(TestMetaNode)

var documentStore = new DocumentStore()
var changeStore = new ChangeStore()

var documentEngine = new DocumentEngine({
  configurator: configurator,
  documentStore: documentStore,
  changeStore: changeStore
})

function setup(cb, t) {
  var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed))
  var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed))
  documentStore.seed(newDocumentStoreSeed, function(err) {
    if (err) return console.error(err)
    changeStore.seed(newChangeStoreSeed, function(err) {
      if (err) return console.error(err)
      cb(t)
    })
  })
}

function setupTest(description, fn) {
  test(description, function (t) {
    setup(fn, t)
  })
}

// Runs the offical backend test suite
testDocumentEngine(documentEngine, setupTest);