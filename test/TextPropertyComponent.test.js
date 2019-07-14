import { test } from 'substance-test'
import { TextPropertyComponent } from 'substance'
import { getMountPoint } from './shared/testHelpers'
import setupEditor from './shared/setupEditor'

// TODO: add tests for missed branches of TextPropertyComponent._getCharPos()
// -> however this is not easy, as some cases seem to be there to handle
// observed edge cases. Unfortunately I have not documented these cases
// nor have I added tests covering these branches.

test('TextPropertyComponent: Get coordinate of empty property', t => {
  let { editorSession, doc } = setupEditor(t, (doc, body) => {
    doc.create({
      type: 'paragraph',
      id: 'empty',
      content: ''
    })
  })
  let comp = TextPropertyComponent.mount({
    doc: doc,
    path: ['empty', 'content']
  }, getMountPoint(t), { context: editorSession.getContext() })

  let coor = comp.getDOMCoordinate(0)

  t.notNil(coor, 'Coordinate should be not null.')
  t.equal(coor.container, comp.el.getNativeElement(), 'element should be property element')
  t.equal(coor.offset, 0, 'offset should be 0')
  t.end()
})

test('TextPropertyComponent: Get coordinate if cursor is inside inline-node', t => {
  let { surface, doc } = setupEditor(t, (doc, body) => {
    let p1 = doc.create({
      type: 'paragraph',
      id: 'p1',
      content: 'ab x cd'
    })
    doc.create({
      type: 'test-inline-node',
      id: 'in1',
      content: 'foo',
      start: {
        path: p1.getPath(),
        offset: 3
      },
      end: {
        offset: 4
      }
    })
    body.append(p1)
  })
  let rootEl = surface.getElement()
  let p1 = doc.get('p1')
  let in1Comp = surface.find('[data-id=in1]')
  let el, coor
  // Note: the inline-node case has the most exceptions re cursor mapping
  el = in1Comp.getElement()
  coor = TextPropertyComponent.getCoordinate(rootEl, el, 1)
  t.deepEqual(coor.toJSON(), { path: p1.getPath(), offset: 4 }, 'coordinate should be mapped correctly')

  el = in1Comp.getElement().getChildAt(0)
  coor = TextPropertyComponent.getCoordinate(rootEl, el, 1)
  t.deepEqual(coor.toJSON(), { path: p1.getPath(), offset: 4 }, 'coordinate should be mapped correctly')

  el = in1Comp.getElement().getChildAt(0).getChildAt(0)
  coor = TextPropertyComponent.getCoordinate(rootEl, el, 1)
  t.deepEqual(coor.toJSON(), { path: p1.getPath(), offset: 4 }, 'coordinate should be mapped correctly')

  t.end()
})
