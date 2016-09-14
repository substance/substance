import uuid from '../../util/uuid'

export default function insertParagraph(tx) {
  var body = tx.get('body')
  var id = uuid()
  tx.create({
    id: id,
    type: 'paragraph',
    content: '0123456789'
  })
  body.show(id)
}
