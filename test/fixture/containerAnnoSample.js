export default function(tx) {
  let body = tx.get('body')
  tx.create({
    type: 'paragraph',
    id: 'p1',
    content: '0123456789'
  })
  tx.create({
    type: 'paragraph',
    id: 'p2',
    content: '0123456789'
  })
  tx.create({
    type: 'paragraph',
    id: 'p3',
    content: '0123456789'
  })
  tx.create({
    type: 'paragraph',
    id: 'p4',
    content: '0123456789'
  })
  tx.create({
    type: 'test-container-anno',
    id: 'a1',
    start: {
      path: ['p1', 'content'],
      offset: 5,
    },
    end: {
      path: ['p3', 'content'],
      offset: 4
    },
    containerId: 'body'
  })
  tx.create({
    type: 'strong',
    id: 'a2',
    start: {
      path: ['p1', 'content'],
      offset: 0,
    },
    end: {
      offset: 2
    }
  })
  body.show('p1')
  body.show('p2')
  body.show('p3')
  body.show('p4')
  return tx
}
