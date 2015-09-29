var surfaceKeyBindings = require('../surface/default_keybindings');

var defaultKeybindings = {
  "surface": surfaceKeyBindings,
  "workspace": [
    {"keys": ["esc"], "command": "resetState"},
    {"keys": ["meta+s", "ctrl+s"], "command": "save"}
  ]
};