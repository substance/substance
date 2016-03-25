module.exports = [
  {
    "from": "user1",
    "to": "hub",
    "data": {
      "type": "connect",
      "documentId": "test-doc",
      "version": 1,
      "change": {
        "sha": "bbce00ffaaf4289c80a18aa8cbc14454",
        "before": {
          "selection": null
        },
        "ops": [],
        "info": {},
        "after": {
          "selection": null
        }
      },
      "scope": "substance/collab",
      "collaboratorId": "6c83b78e60b7e22e775728f8c1b2b4ad"
    }
  },
  {
    "from": "user2",
    "to": "hub",
    "data": {
      "type": "connect",
      "documentId": "test-doc",
      "version": 1,
      "change": {
        "sha": "5613a70e8e719093d4d5765b2292a720",
        "before": {
          "selection": null
        },
        "ops": [],
        "info": {},
        "after": {
          "selection": null
        }
      },
      "scope": "substance/collab",
      "collaboratorId": "9bb90734d220c0e7095f376abf22f849"
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
      "collaborators": {},
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user1",
    "data": {
      "type": "update",
      "version": 1,
      "change": {
        "sha": "5613a70e8e719093d4d5765b2292a720",
        "before": {
          "selection": null
        },
        "ops": [],
        "info": {},
        "after": {
          "selection": null
        }
      },
      "collaboratorId": "9bb90734d220c0e7095f376abf22f849",
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
        "collaboratorId": "9bb90734d220c0e7095f376abf22f849",
        "colorIndex": 1
      },
      "documentId": "test-doc",
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
        "6c83b78e60b7e22e775728f8c1b2b4ad": {
          "selection": null,
          "collaboratorId": "6c83b78e60b7e22e775728f8c1b2b4ad",
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
        "sha": "e0ce304c364611021afc91852507ad0c",
        "before": {
          "selection": null
        },
        "ops": [],
        "info": {},
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
      "collaboratorId": "6c83b78e60b7e22e775728f8c1b2b4ad"
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
        "sessionId": 5,
        "sha": "6b78853a577a5076904a931454c19b56",
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
        "info": {},
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
      "collaboratorId": "6c83b78e60b7e22e775728f8c1b2b4ad"
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
        "sha": "ce1c3d1a0f447dd91f771573bedc2674",
        "before": {
          "selection": null
        },
        "ops": [],
        "info": {},
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
      "collaboratorId": "9bb90734d220c0e7095f376abf22f849"
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
        "sessionId": 6,
        "sha": "fc9228b67225257954c4be73cb659d24",
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
        "info": {},
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
      "collaboratorId": "9bb90734d220c0e7095f376abf22f849"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "update",
      "version": 1,
      "change": {
        "sha": "e0ce304c364611021afc91852507ad0c",
        "before": {
          "selection": null
        },
        "ops": [],
        "info": {},
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
      "collaboratorId": "6c83b78e60b7e22e775728f8c1b2b4ad",
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
        "sessionId": 5,
        "sha": "6b78853a577a5076904a931454c19b56",
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
        "info": {},
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
      "collaboratorId": "6c83b78e60b7e22e775728f8c1b2b4ad",
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
      "type": "update",
      "version": 2,
      "change": {
        "sha": "ce1c3d1a0f447dd91f771573bedc2674",
        "before": {
          "selection": null
        },
        "ops": [],
        "info": {},
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
      "collaboratorId": "9bb90734d220c0e7095f376abf22f849",
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
        "sessionId": 6,
        "sha": "fc9228b67225257954c4be73cb659d24",
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
        "info": {},
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
      "collaboratorId": "9bb90734d220c0e7095f376abf22f849",
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
          "sessionId": 5,
          "sha": "6b78853a577a5076904a931454c19b56",
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
          "info": {},
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
