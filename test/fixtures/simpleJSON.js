// same as simple.js but as serialized JSON
module.exports = function() {
  return {
    schema: {
      name: "test-article",
      version: "1.0.0"
    },
    nodes: [
      {
        type: "meta",
        id: "meta",
        title: 'Untitled'
      },
      {
        type: 'paragraph',
        id: 'p1',
        content: '0123456789'
      },
      {
        type: 'paragraph',
        id: 'p2',
        content: '0123456789'
      },
      {
        type: 'paragraph',
        id: 'p3',
        content: '0123456789'
      },
      {
        type: 'paragraph',
        id: 'p4',
        content: '0123456789'
      },
      {
        type: "container",
        id: "main",
        nodes: ['p1', 'p2', 'p3', 'p4']
      }
    ]
  };
};
