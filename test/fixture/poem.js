export default function(tx) {
  var body = tx.get('body')

  tx.create({
    id: 'h1',
    type: 'heading',
    level: 1,
    content: 'A Dream Within a Dream'
  })
  body.show('h1')

  tx.create({
    id: 'h2',
    type: 'heading',
    level: 2,
    content: 'by Edgar Allan Poe'
  })
  body.show('h2')

  tx.create({
    id: 'p1',
    type: 'paragraph',
    content: [
      "Take this kiss upon the brow!",
      "And, in parting from you now,",
      "Thus much let me avow--",
      "You are not wrong, who deem",
      "That my days have been a dream",
      "Yet if hope has flown away",
      "In a night, or in a day,",
      "In a vision, or in none,",
      "Is it therefore the less gone?",
      "All that we see or seem",
      "Is but a dream within a dream."
    ].join("\n")
  })
  body.show('p1')

  tx.create({
    id: 'p2',
    type: 'paragraph',
    content: [
      "I stand amid the roar",
      "Of a surf-tormented shore,",
      "And I hold within my hand",
      "Grains of the golden sand--",
      "How few! yet how they creep",
      "Through my fingers to the deep,",
      "While I weep--while I weep!",
      "O God! can I not grasp",
      "Them with a tighter clasp?",
      "O God! can I not save",
      "One from the pitiless wave?",
      "Is all that we see or seem",
      "But a dream within a dream?"
    ].join("\n")
  })
  body.show('p2')
}