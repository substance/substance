module.exports = [
  {
    "from": "user1",
    "to": "hub",
    "data": {
      "type": "connect",
      "documentId": "test-doc",
      "version": 3, // 
      "scope": "substance/collab",
      "collaboratorId": "81e1f50ae8f94dd2c055a2d73b848726"
    }
  },
  {
    "from": "user2",
    "to": "hub",
    "data": {
      "type": "connect",
      "documentId": "test-doc",
      "version": 1,
      "scope": "substance/collab",
      "collaboratorId": "f76726ae2773440a33b6a1e1987cdf67"
    }
  }
];
