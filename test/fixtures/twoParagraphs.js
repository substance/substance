export default function(tx) {
  var body = tx.get('body')
  tx.create({
    id: 'p1',
    type: 'paragraph',
    content: '0123456789'
  })
  body.show('p1')

  tx.create({
    id: 'p2',
    type: 'paragraph',
    content: '0123456789'
  })
  body.show('p2')
}
