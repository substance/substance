import { test } from 'substance-test'
import { TextPropertyComponent } from 'substance'
import { getMountPoint } from './shared/testHelpers'
import createTestArticle from './shared/createTestArticle'
import simple from './fixture/simple'

test('TextPropertyComponent: Get coordinate of empty property', t => {
  let doc = createTestArticle(simple)
  doc.create({
    type: 'paragraph',
    id: 'empty',
    content: ''
  })
  let comp = TextPropertyComponent.mount({
    doc: doc,
    path: ['empty', 'content']
  }, getMountPoint(t))

  let coor = comp.getDOMCoordinate(0)

  t.notNil(coor, 'Coordinate should be not null.')
  t.equal(coor.container, comp.el.getNativeElement(), 'element should be property element')
  t.equal(coor.offset, 0, 'offset should be 0')
  t.end()
})
