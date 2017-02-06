import { module } from 'substance-test'
import TextPropertyComponent from '../ui/TextPropertyComponent'
import fixture from './fixture/createTestArticle'
import simple from './fixture/simple'

const test = module('TextPropertyComponent')

test("Get coordinate of empty property", function(t) {
  var doc = fixture(simple)
  doc.create({
    type: 'paragraph',
    id: 'empty',
    content: ''
  })
  var comp = TextPropertyComponent.mount({
    doc: doc,
    path: ['empty', 'content']
  }, t.sandbox)

  var coor = comp.getDOMCoordinate(0)

  t.notNil(coor, 'Coordinate should be not null.')
  t.equal(coor.container, comp.el.getNativeElement(), 'element should be property element')
  t.equal(coor.offset, 0, 'offset should be 0')
  t.end()
})
