'use strict';

module.exports = function nestedContainers(tx) {
  var body = tx.get('body');

  var p1 = tx.create({
    type: 'paragraph',
    id: 'p1',
    content: 'ABCDEF'
  });
  body.show(p1);

  var c1 = tx.create({
    type: 'container',
    id: 'c1',
    nodes: []
  });
  tx.create({
    type: 'paragraph',
    id: 'c1_p1',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
  });
  c1.show('c1_p1');

  var c2 = tx.create({
    type: 'container',
    id: 'c2',
    nodes: []
  });
  tx.create({
    type: 'paragraph',
    id: 'c2_p1',
    content: 'Nunc turpis erat, sodales id aliquet eget, rutrum vel libero.'
  });
  c2.show('c2_p1');
  c1.show('c2');

  tx.create({
    type: 'paragraph',
    id: 'c1_p2',
    content: 'Donec dapibus vel leo sit amet auctor. Curabitur at diam urna.'
  });
  c1.show('c1_p2');

  var p2 = tx.create({
    type: 'paragraph',
    id: 'p2',
    content: 'ABCDEF'
  });
  body.show(p2);

  body.show('c1');
};
