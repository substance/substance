module.exports = [
  {
    "from": "user1",
    "to": "hub",
    "data": {
      "type": "connect",
      "documentId": "test-doc",
      "version": 1,
      "scope": "substance/collab",
      "collaboratorId": "dfd9875adc4ff6981a71241a7d673f16"
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
      "collaboratorId": "a7e6d83a643a1874f28a3af6f776a601"
    }
  },
  {
    "from": "hub",
    "to": "user1",
    "data": {
      "type": "connectDone",
      "documentId": "test-doc",
      "version": 1,
      "changes": [],
      "collaborators": {
        "a7e6d83a643a1874f28a3af6f776a601": {
          "selection": {
            "type": "property",
            "path": [
              "p1",
              "content"
            ],
            "startOffset": 7,
            "endOffset": 7,
            "reverse": false,
            "surfaceId": "bodyEditor"
          },
          "collaboratorId": "a7e6d83a643a1874f28a3af6f776a601",
          "colorIndex": 1
        }
      },
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user1",
    "data": {
      "type": "collaboratorConnected",
      "documentId": "test-doc",
      "collaborator": {
        "selection": {
          "type": "property",
          "path": [
            "p1",
            "content"
          ],
          "startOffset": 7,
          "endOffset": 7,
          "reverse": false,
          "surfaceId": "bodyEditor"
        },
        "collaboratorId": "a7e6d83a643a1874f28a3af6f776a601",
        "colorIndex": 1
      },
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "connectDone",
      "documentId": "test-doc",
      "version": 1,
      "changes": [],
      "collaborators": {
        "dfd9875adc4ff6981a71241a7d673f16": {
          "selection": {
            "type": "property",
            "path": [
              "p1",
              "content"
            ],
            "startOffset": 7,
            "endOffset": 7,
            "reverse": false,
            "surfaceId": "bodyEditor"
          },
          "collaboratorId": "dfd9875adc4ff6981a71241a7d673f16",
          "colorIndex": 1
        }
      },
      "scope": "substance/collab"
    }
  },
  {
    "from": "user1",
    "to": "hub",
    "data": {
      "type": "updateSelection",
      "documentId": "test-doc",
      "version": 1,
      "change": {
        "sha": "b1246daaebb5972a48b9296a20da02b3",
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
      "scope": "substance/collab",
      "collaboratorId": "dfd9875adc4ff6981a71241a7d673f16"
    }
  },
  {
    "from": "user1",
    "to": "hub",
    "data": {
      "type": "commit",
      "documentId": "test-doc",
      "version": 1,
      "change": {
        "sessionId": 2,
        "sha": "02926328e4cd83bb8cab231f5cd1c1ac",
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
      "scope": "substance/collab",
      "collaboratorId": "dfd9875adc4ff6981a71241a7d673f16"
    }
  },
  {
    "from": "user2",
    "to": "hub",
    "data": {
      "type": "updateSelection",
      "documentId": "test-doc",
      "version": 1,
      "change": {
        "sha": "e87537ec16064d2690cd5efb0155bff2",
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
      "scope": "substance/collab",
      "collaboratorId": "a7e6d83a643a1874f28a3af6f776a601"
    }
  },
  {
    "from": "user2",
    "to": "hub",
    "data": {
      "type": "commit",
      "documentId": "test-doc",
      "version": 1,
      "change": {
        "sessionId": 3,
        "sha": "1cbd4ec67ca27e7b1be3df5356625707",
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
      "scope": "substance/collab",
      "collaboratorId": "a7e6d83a643a1874f28a3af6f776a601"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "updateSelection",
      "version": 1,
      "change": {
        "sha": "b1246daaebb5972a48b9296a20da02b3",
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
      "collaboratorId": "dfd9875adc4ff6981a71241a7d673f16",
      "documentId": "test-doc",
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "update",
      "version": 2,
      "change": {
        "sessionId": 2,
        "sha": "02926328e4cd83bb8cab231f5cd1c1ac",
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
      "collaboratorId": "dfd9875adc4ff6981a71241a7d673f16",
      "documentId": "test-doc",
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user1",
    "data": {
      "documentId": "test-doc",
      "type": "commitDone",
      "version": 2,
      "changes": [],
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user1",
    "data": {
      "type": "updateSelection",
      "version": 2,
      "change": {
        "sha": "e87537ec16064d2690cd5efb0155bff2",
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
            "startOffset": 6,
            "endOffset": 6,
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "collaboratorId": "a7e6d83a643a1874f28a3af6f776a601",
      "documentId": "test-doc",
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user1",
    "data": {
      "type": "update",
      "version": 3,
      "change": {
        "sessionId": 3,
        "sha": "1cbd4ec67ca27e7b1be3df5356625707",
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
            "startOffset": 7,
            "endOffset": 7,
            "reverse": false,
            "surfaceId": "bodyEditor"
          },
          "surfaceId": "bodyEditor"
        }
      },
      "collaboratorId": "a7e6d83a643a1874f28a3af6f776a601",
      "documentId": "test-doc",
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "documentId": "test-doc",
      "type": "commitDone",
      "version": 3,
      "changes": [
        {
          "sessionId": 2,
          "sha": "02926328e4cd83bb8cab231f5cd1c1ac",
          "before": {
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
                "pos": 6,
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
              "startOffset": 7,
              "endOffset": 7,
              "reverse": false,
              "surfaceId": "bodyEditor"
            },
            "surfaceId": "bodyEditor"
          }
        }
      ],
      "scope": "substance/collab"
    }
  }
];
