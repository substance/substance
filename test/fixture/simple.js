/*
  Creates a document with the following content

  ```
  body:
    p1: '0123456789'
    p2: '0123456789'
    p3: '0123456789'
    p4: '0123456789'
  ```
*/
export default function simple(tx) {
  let body = tx.get('body')
  tx.create({
    type: 'paragraph',
    id: 'p1',
    content: '0123456789'
  })
  body.show('p1')
  tx.create({
    type: 'paragraph',
    id: 'p2',
    content: '0123456789'
  })
  body.show('p2')
  tx.create({
    type: 'paragraph',
    id: 'p3',
    content: '0123456789'
  })
  body.show('p3')
  tx.create({
    type: 'paragraph',
    id: 'p4',
    content: '0123456789'
  })
  body.show('p4')
}
