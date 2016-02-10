module.exports = function() {
  return [
    {
      "from": "user1",
      "to": "hub",
      "data": [
        "commit",
        "test",
        1,
        {
          "sessionId": "c9cf6f38e666d82dca1c34d59e2ea7d4",
          "sha": "acd682a670b485210ccbd5fc2b2f754c",
          "state": 1,
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
        }
      ]
    },
    {
      "from": "user2",
      "to": "hub",
      "data": [
        "commit",
        "test",
        1,
        {
          "sessionId": "a459ffe27d2f9822d15c7ec21311bcd8",
          "sha": "8ddf7b293dbe74494f04b298391429b6",
          "state": 1,
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
        }
      ]
    }
  ];
};