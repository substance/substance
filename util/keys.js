/* eslint-disable strict */
let keys = {
  UNDEFINED: 0,
  BACKSPACE: 8,
  DELETE: 46,
  INSERT: 45,
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  RETURN: 13,
  END: 35,
  HOME: 36,
  TAB: 9,
  PAGEUP: 33,
  PAGEDOWN: 34,
  ESCAPE: 27,
  ESC: 27,
  SHIFT: 16,
  SPACE: 32,
  PLUS: 171,
  VOLUMEUP: 183,
  VOLUMEDOWN: 182,
  VOLUMEMUTE: 181,
  PRINTSCREEN: 44
}

// Handle F1 to F24 keys
for (let i = 1; i <= 24; i++) {
  keys['F' + i] = 111 + i
}

export default keys
