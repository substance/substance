module.exports = [
  {
    "from": "user1",
    "to": "hub",
    "data": {
      "type": "connect",
      "documentId": "test-doc",
      "version": 1,
      "change": {
        "sha": "541e0a75653b6cbc9695eba35daad44d",
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
      "collaboratorId": "3571119a2782d5a66174530f559b7738"
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
        "sha": "f17a1aea4214051a2dc9cab8f636ec28",
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
      "collaboratorId": "42fccd767a4cb27ae1f96cff7dedebcf"
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
        "sha": "f17a1aea4214051a2dc9cab8f636ec28",
        "before": {
          "selection": null
        },
        "ops": [],
        "info": {},
        "after": {
          "selection": null
        }
      },
      "collaboratorId": "42fccd767a4cb27ae1f96cff7dedebcf",
      "collaborator": {
        "selection": {
          "type": "property",
          "path": [
            "p1",
            "content"
          ],
          "startOffset": 5,
          "endOffset": 8,
          "reverse": false,
          "surfaceId": "bodyEditor"
        },
        "collaboratorId": "42fccd767a4cb27ae1f96cff7dedebcf",
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
        "3571119a2782d5a66174530f559b7738": {
          "selection": {
            "type": "property",
            "path": [
              "p1",
              "content"
            ],
            "startOffset": 0,
            "endOffset": 4,
            "reverse": false,
            "surfaceId": "bodyEditor"
          },
          "collaboratorId": "3571119a2782d5a66174530f559b7738",
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
        "sha": "e8a324b75d72789a86fa6328035f5dd0",
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
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "scope": "substance/collab",
      "collaboratorId": "3571119a2782d5a66174530f559b7738"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "update",
      "version": 1,
      "change": {
        "sha": "e8a324b75d72789a86fa6328035f5dd0",
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
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "collaboratorId": "3571119a2782d5a66174530f559b7738",
      "documentId": "test-doc",
      "scope": "substance/collab"
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
        "sha": "777d80fb1486e4adf9f42f6152fb000d",
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
            "endOffset": 8,
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "scope": "substance/collab",
      "collaboratorId": "42fccd767a4cb27ae1f96cff7dedebcf"
    }
  },
  {
    "from": "hub",
    "to": "user1",
    "data": {
      "type": "update",
      "version": 1,
      "change": {
        "sha": "777d80fb1486e4adf9f42f6152fb000d",
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
            "endOffset": 8,
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "collaboratorId": "42fccd767a4cb27ae1f96cff7dedebcf",
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
      "collaboratorId": "3571119a2782d5a66174530f559b7738",
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
      "change": {
        "sha": "1e31ee218353db534081b289a27a3ede",
        "before": {
          "selection": {
            "type": "property",
            "path": [
              "p1",
              "content"
            ],
            "startOffset": 0,
            "endOffset": 4,
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
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
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "scope": "substance/collab",
      "collaboratorId": "1342e680ab3baddc3246cc67bf9a9bb7"
    }
  },
  {
    "from": "hub",
    "to": "user2",
    "data": {
      "type": "update",
      "version": 1,
      "change": {
        "sha": "1e31ee218353db534081b289a27a3ede",
        "before": {
          "selection": {
            "type": "property",
            "path": [
              "p1",
              "content"
            ],
            "startOffset": 0,
            "endOffset": 4,
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
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
            "reverse": false,
            "surfaceId": "bodyEditor"
          }
        }
      },
      "collaboratorId": "1342e680ab3baddc3246cc67bf9a9bb7",
      "collaborator": {
        "selection": {
          "type": "property",
          "path": [
            "p1",
            "content"
          ],
          "startOffset": 0,
          "endOffset": 4,
          "reverse": false,
          "surfaceId": "bodyEditor"
        },
        "collaboratorId": "1342e680ab3baddc3246cc67bf9a9bb7",
        "colorIndex": 2
      },
      "documentId": "test-doc",
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
        "42fccd767a4cb27ae1f96cff7dedebcf": {
          "selection": {
            "type": "property",
            "path": [
              "p1",
              "content"
            ],
            "startOffset": 5,
            "endOffset": 8,
            "reverse": false,
            "surfaceId": "bodyEditor"
          },
          "collaboratorId": "42fccd767a4cb27ae1f96cff7dedebcf",
          "colorIndex": 2
        }
      },
      "scope": "substance/collab"
    }
  }
];