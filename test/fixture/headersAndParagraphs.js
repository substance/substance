export default function headersAndParagraphs(tx) {
  var body = tx.get('body')
  tx.create({
    type: 'heading',
    id: 'h1',
    content: 'Section 1',
    level: 1
  })
  body.show('h1')
  tx.create({
    type: 'paragraph',
    id: 'p1',
    content: 'Paragraph 1'
  })
  body.show('p1')
  tx.create({
    type: 'heading',
    id: 'h2',
    content: 'Section 2',
    level: 1
  })
  body.show('h2')
  tx.create({
    type: 'paragraph',
    id: 'p2',
    content: 'Paragraph with annotation'
  })
  body.show('p2')
  tx.create({
    type: 'emphasis',
    id: 'em1',
    start: {
      path: ['p2', 'content'],
      offset: 15,
    },
    end: {
      offset: 25
    }
  })
  tx.create({
    type: 'heading',
    id: 'h3',
    content: 'Section 2.2',
    level: 2
  })
  body.show('h3')
  tx.create({
    type: 'paragraph',
    id: 'p3',
    content: 'Paragraph 3'
  })
  body.show('p3')
  // tx.create({
  //   type: "test-node",
  //   id: "test",
  //   boolVal: true,
  //   stringVal: "Test",
  //   arrayVal: [1, 2, 3, 4],
  //   objectVal: { "a": 1, "b": 2 }
  // })
}
