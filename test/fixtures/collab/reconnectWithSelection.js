module.exports = [
  {
    "from": "user1",
    "to": "hub",
    "data": {
      "type": "connect",
      "documentId": "test-doc",
      "version": 1,
      "scope": "substance/collab",
      "collaboratorId": "90279eccbca04aa2d3d392e7b9f94c40"
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
      "collaboratorId": "2a2fb09243786dac23964a0a3a666661"
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
        "2a2fb09243786dac23964a0a3a666661": {
          "selection": null,
          "collaboratorId": "2a2fb09243786dac23964a0a3a666661",
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
        "selection": null,
        "collaboratorId": "2a2fb09243786dac23964a0a3a666661",
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
        "1fc84b977f9ce6cbff8c618d2aa61c3e": {
          "selection": null,
          "collaboratorId": "1fc84b977f9ce6cbff8c618d2aa61c3e",
          "colorIndex": 2
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
        "sha": "da594cc83752555a25ad4b99f37f73fd",
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
            "startOffset": 0,
            "endOffset": 4,
            "reverse": true,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "scope": "substance/collab",
      "collaboratorId": "90279eccbca04aa2d3d392e7b9f94c40"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "updateSelection",
      "version": 1,
      "change": {
        "sha": "da594cc83752555a25ad4b99f37f73fd",
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
            "startOffset": 0,
            "endOffset": 4,
            "reverse": true,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "collaboratorId": "90279eccbca04aa2d3d392e7b9f94c40",
      "documentId": "test-doc",
      "scope": "substance/collab"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "collaboratorDisconnected",
      "documentId": "test-doc",
      "collaboratorId": "90279eccbca04aa2d3d392e7b9f94c40",
      "scope": "substance/collab"
    }
  },
  {
    "from": "user1",
    "to": "hub",
    "data": {
      "type": "connect",
      "documentId": "test-doc",
      "version": 1,
      "scope": "substance/collab",
      "collaboratorId": "1fc84b977f9ce6cbff8c618d2aa61c3e"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "collaboratorConnected",
      "documentId": "test-doc",
      "collaborator": {
        "selection": null,
        "collaboratorId": "1fc84b977f9ce6cbff8c618d2aa61c3e",
        "colorIndex": 2
      },
      "scope": "substance/collab"
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
        "2a2fb09243786dac23964a0a3a666661": {
          "selection": null,
          "collaboratorId": "2a2fb09243786dac23964a0a3a666661",
          "colorIndex": 2
        }
      },
      "scope": "substance/collab"
    }
  }
];