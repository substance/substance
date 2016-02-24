module.exports = function() {
  return [
    {
      "from": "user1",
      "to": "hub",
      "data": {
        "type": "open",
        "documentId": "test",
        "version": 0,
        "sessionToken": "user1token",
        "scope": "hub"
      }
    },
    {
      "from": "user2",
      "to": "hub",
      "data": {
        "type": "open",
        "documentId": "test",
        "version": 0,
        "sessionToken": "user2token",
        "scope": "hub"
      }
    },
    {
      "from": "hub",
      "to": "user1",
      "data": {
        "type": "openDone",
        "version": 1,
        "changes": [
          {
            "sessionId": 1,
            "sha": "71496986b89eca61a1b8cec591c08db4",
            "before": {},
            "ops": [
              {
                "type": "create",
                "path": [
                  "p1"
                ],
                "val": {
                  "id": "p1",
                  "type": "paragraph",
                  "content": "0123456789"
                }
              },
              {
                "type": "update",
                "path": [
                  "body",
                  "nodes"
                ],
                "propertyType": "array",
                "diff": {
                  "type": "insert",
                  "pos": 0,
                  "val": "p1"
                }
              },
              {
                "type": "create",
                "path": [
                  "p2"
                ],
                "val": {
                  "id": "p2",
                  "type": "paragraph",
                  "content": "0123456789"
                }
              },
              {
                "type": "update",
                "path": [
                  "body",
                  "nodes"
                ],
                "propertyType": "array",
                "diff": {
                  "type": "insert",
                  "pos": 1,
                  "val": "p2"
                }
              }
            ],
            "after": {}
          }
        ],
        "collaborators": {
          "d3d86107711f870225578bcf0a14e78b": {
            "user": {
              "userId": "user2",
              "password": "demo",
              "name": "User 2"
            },
            "selection": null,
            "collaboratorId": "d3d86107711f870225578bcf0a14e78b",
            "collaboratorIndex": 2
          }
        },
        "scope": "hub",
        "documentId": "test"
      }
    },
    {
      "from": "hub",
      "to": "user2",
      "data": {
        "type": "openDone",
        "version": 1,
        "changes": [
          {
            "sessionId": 1,
            "sha": "71496986b89eca61a1b8cec591c08db4",
            "before": {},
            "ops": [
              {
                "type": "create",
                "path": [
                  "p1"
                ],
                "val": {
                  "id": "p1",
                  "type": "paragraph",
                  "content": "0123456789"
                }
              },
              {
                "type": "update",
                "path": [
                  "body",
                  "nodes"
                ],
                "propertyType": "array",
                "diff": {
                  "type": "insert",
                  "pos": 0,
                  "val": "p1"
                }
              },
              {
                "type": "create",
                "path": [
                  "p2"
                ],
                "val": {
                  "id": "p2",
                  "type": "paragraph",
                  "content": "0123456789"
                }
              },
              {
                "type": "update",
                "path": [
                  "body",
                  "nodes"
                ],
                "propertyType": "array",
                "diff": {
                  "type": "insert",
                  "pos": 1,
                  "val": "p2"
                }
              }
            ],
            "after": {}
          }
        ],
        "collaborators": {
          "3d65f28e25ae81b47a1c5927ef67ab24": {
            "user": {
              "userId": "user1",
              "password": "demo",
              "name": "User 1"
            },
            "selection": null,
            "collaboratorId": "3d65f28e25ae81b47a1c5927ef67ab24",
            "collaboratorIndex": 1
          }
        },
        "scope": "hub",
        "documentId": "test"
      }
    },
    {
      "from": "hub",
      "to": "user1",
      "data": {
        "type": "collaboratorConnected",
        "collaborator": {
          "user": {
            "userId": "user2",
            "password": "demo",
            "name": "User 2"
          },
          "selection": null,
          "collaboratorId": "d3d86107711f870225578bcf0a14e78b",
          "collaboratorIndex": 2
        },
        "scope": "hub",
        "documentId": "test"
      }
    },
    {
      "from": "user1",
      "to": "hub",
      "data": {
        "type": "updateSelection",
        "documentId": "test",
        "version": 1,
        "change": {
          "sha": "ffb91eedf147e85d88e250ee91efdc66",
          "before": {
            "selection": null
          },
          "ops": [],
          "after": {
            "selection": {
              "type": "property",
              "path": [
                "p1",
                "content"
              ],
              "startOffset": 5,
              "endOffset": 5,
              "reverse": false,
              "surfaceId": "bodyEditor"
            }
          }
        },
        "sessionToken": "user1token",
        "scope": "hub"
      }
    },
    {
      "from": "user1",
      "to": "hub",
      "data": {
        "type": "commit",
        "documentId": "test",
        "version": 1,
        "change": {
          "sessionId": 2,
          "sha": "04a8e11764111936205c376364b71da0",
          "before": {
            "selection": {
              "type": "property",
              "path": [
                "p1",
                "content"
              ],
              "startOffset": 5,
              "endOffset": 5,
              "reverse": false,
              "surfaceId": "bodyEditor"
            },
            "surfaceId": "bodyEditor"
          },
          "ops": [
            {
              "type": "update",
              "path": [
                "p1",
                "content"
              ],
              "propertyType": "string",
              "diff": {
                "type": "insert",
                "pos": 5,
                "str": "a"
              }
            }
          ],
          "after": {
            "selection": {
              "type": "property",
              "path": [
                "p1",
                "content"
              ],
              "startOffset": 6,
              "endOffset": 6,
              "reverse": false,
              "surfaceId": "bodyEditor"
            },
            "surfaceId": "bodyEditor"
          }
        },
        "sessionToken": "user1token",
        "scope": "hub"
      }
    },
    {
      "from": "user2",
      "to": "hub",
      "data": {
        "type": "updateSelection",
        "documentId": "test",
        "version": 1,
        "change": {
          "sha": "f1c62a0254880dcadd32cfb8bebe9c17",
          "before": {
            "selection": null
          },
          "ops": [],
          "after": {
            "selection": {
              "type": "property",
              "path": [
                "p1",
                "content"
              ],
              "startOffset": 5,
              "endOffset": 5,
              "reverse": false,
              "surfaceId": "bodyEditor"
            }
          }
        },
        "sessionToken": "user2token",
        "scope": "hub"
      }
    },
    {
      "from": "user2",
      "to": "hub",
      "data": {
        "type": "commit",
        "documentId": "test",
        "version": 1,
        "change": {
          "sessionId": 3,
          "sha": "0bc94c323d9cd5ea705f307968f708a5",
          "before": {
            "selection": {
              "type": "property",
              "path": [
                "p1",
                "content"
              ],
              "startOffset": 5,
              "endOffset": 5,
              "reverse": false,
              "surfaceId": "bodyEditor"
            },
            "surfaceId": "bodyEditor"
          },
          "ops": [
            {
              "type": "update",
              "path": [
                "p1",
                "content"
              ],
              "propertyType": "string",
              "diff": {
                "type": "insert",
                "pos": 5,
                "str": "b"
              }
            }
          ],
          "after": {
            "selection": {
              "type": "property",
              "path": [
                "p1",
                "content"
              ],
              "startOffset": 6,
              "endOffset": 6,
              "reverse": false,
              "surfaceId": "bodyEditor"
            },
            "surfaceId": "bodyEditor"
          }
        },
        "sessionToken": "user2token",
        "scope": "hub"
      }
    }
  ];
};
