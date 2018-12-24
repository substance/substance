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
export default function simple (doc) {
  let body = doc.get('body')
  doc.create({
    type: 'paragraph',
    id: 'p1',
    content: '0123456789'
  })
  body.append('p1')
  doc.create({
    type: 'paragraph',
    id: 'p2',
    content: '0123456789'
  })
  body.append('p2')
  doc.create({
    type: 'paragraph',
    id: 'p3',
    content: '0123456789'
  })
  body.append('p3')
  doc.create({
    type: 'paragraph',
    id: 'p4',
    content: '0123456789'
  })
  body.append('p4')
}
