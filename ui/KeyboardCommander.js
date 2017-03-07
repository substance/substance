/**
  Experimental: A keyboard combo listener.

  It allows for simple combos, such as 'ctrl-a', as well as for
  composite combos (sequences), such as 'ctrl-a ctrl-b'.

  What do we want to achieve?

  1. Single key shortcut, e.g. esc
  2. Key combos, e.g. modifier keys + one symbol
  Modifier keys: "meta", "alt", "option", "ctrl", "shift", "cmd"
  3. Key sequences, e.g. number of keys and combos typed in order

  We want to be able to attach commander to different components,
  e.g. surface or top-level controller
*/
export default
class KeyboardCommander {

  constructor(component) {
    this.component = component
    this.combos = {}
    this.sequences = {}
    this.resetTimeout = 1000
  }

  /*
    Attach commander to desired element for
    key events listening
  */
  attach(el) {
    el.on('keydown', this._handleInput.bind(this))
    el.on('keyup', this._handleInput.bind(this))
  }

  /*
    Bind single key, combo or sequence to function
    (for example calling command)
  */
  bind(combo, action) {
    var comboKey = this._computeKey(combo)
    this.combos[comboKey] = action
  }

  /*
    Handles key events input.
    For each keydown event we are trying to find binded action
    and also calling sequencer if input didn't contains combos.
    If input contains combos then we are calling sequencer on keyup.
    E.g. if you have sequence "a b alt+shift+d" you'll never reproduce
    this sequence with keydown events. You will have "a b alt alt+shift alt+shift+s",
    so every combo is passed to sequencer only when first keyup fired after keydown
    (and we are sending last keydown combos).
  */
  _handleInput(e) {
    var that = this
    var type = e.type
    var key = typeof e.which !== 'number' ? e.keyCode : e.which
    var keyName = this._getKeyName(key)
    var combo = {
      key: this._isModifier(keyName) ? false : keyName,
      modifiers: this._getModifiers(e)
    }
    this._sequencerTimer()
    var comboKey = this._getComboKey(combo)
    var actions = []

    if (type === 'keydown') {
      var action = this._findAction(comboKey)
      if(action) action.call(this.component)
    }

    if (type === 'keydown' && combo.modifiers.length === 0) {
      actions = this._sequencer(comboKey)
    } else if (type === 'keyup' && this.lastType === 'keydown' && (!combo.key || combo.modifiers.length > 0)) {
      actions = this._sequencer(this.lastKey)
    }

    actions.forEach(function(action) {
      that.combos[action].call(that.component)
    })

    this.lastKey = comboKey
    this.lastType = type
  }

  /*
    Get combo string representation,
    e.g. ordered modifiers and key (alt+meta+z)
  */
  _getComboKey(combo) {
    var comboKey = combo.modifiers.join('+')
    if(comboKey.length > 0 && combo.key) comboKey += '+'
    if(combo.key) comboKey += combo.key
    return comboKey
  }

  /*
    Get function attached to single key or combo
  */
  _findAction(comboKey) {
    return this.combos[comboKey]
  }

  /*
    Track sequences
  */

  // Sequencer receives input, updates sequnces index and
  // returns matched sequences if input is final piece of it
  //
  // Note that sequence registry (this.sequences) is map of
  // sequences to arrays which consists of positions of active sequences
  // e.g. if you bind functions to two sequnces: "a b c" and "b c b c" and
  // then typed "a b" you will have this registry {"abc":[2], "bcbc": [1]}
  // if you type "c" afterwards you will have {"abc":[], "bcbc": [2]} and
  // sequencer will return ["abc"] as result, if you'll type "b" again
  // then you'll have {"abc":[], "bcbc": [3, 1]} because "bcbc" matched two
  // times.
  // Note that if you use combos in sequence then position will increments
  // with length of combo, e.g. for ctrl+alt+s position will increments with 10
  // If input is not matched already active sequence we will throw away position.
  // If input is beginning of not active sequence it will be added to registry.
  _sequencer(inputCombo) {
    const that = this
    const sequences = this.sequences
    const inputLength = inputCombo.length
    let actions = []
    for (let combo in sequences) {
      if (!sequences.hasOwnProperty(combo)) continue
      sequences[combo].forEach((pos, index) => {
        if(combo.substring(pos, pos+inputLength) === inputCombo && (pos+inputLength <= combo.length)) {
          if(pos+inputLength === combo.length) {
            actions.push(combo)
            delete that.sequences[combo][index]
          } else {
            that.sequences[combo][index] += inputLength
          }
        } else {
          delete that.sequences[combo][index]
        }
      })
    }
    const combos = Object.keys(this.combos)
    for (let i = combos.length - 1; i >= 0; i--) {
      if (combos[i].indexOf(inputCombo) === 0) {
        if(this.sequences[combos[i]]) {
          this.sequences[combos[i]].push(1)
        } else {
          this.sequences[combos[i]] = [1]
        }
      }
    }
    return actions
  }

  /*
    Clear sequences registry
  */
  _resetSequencer() {
    const sequences = this.sequences
    for (let combo in sequences) {
      if (!sequences.hasOwnProperty(combo)) continue
      delete this.sequences[combo]
    }
  }

  /*
    If user will not typing anything during defined time
    we should reset sequence registry as user is probably
    not trying to call sequence
  */
  _sequencerTimer() {
    window.clearTimeout(this.timerId)
    this.timerId = setTimeout(this._resetSequencer.bind(this), this.resetTimeout)
  }

  /*
    Helpers
  */

  // Transforms attached combination to key string
  // During this process, modifiers from combos
  // will be sorted in alphabetic order
  _computeKey(combination) {
    var self = this
    var key = ''

    combination = combination.replace(/\+{2}/g, '+plus').split(' ')
    combination.forEach(function(keys) {
      keys = keys.split('+')
      var modifiers = []
      var nonModifiers = []
      keys.forEach(function(key){
        var isModifier = self._isModifier(key)
        if (isModifier) {
          modifiers.push(key)
        } else {
          nonModifiers.push(key)
        }
      })
      modifiers.sort()
      nonModifiers.sort()
      var combo = modifiers.concat(nonModifiers)
      key += combo.join('+')
    })

    return key
  }

  /*
    Get array of modifier keys from event
  */
  _getModifiers(e) {
    var modifiers = []

    if (e.altKey) modifiers.push('alt')
    if (e.ctrlKey) modifiers.push('ctrl')
    if (e.metaKey) modifiers.push('meta')
    if (e.shiftKey) modifiers.push('shift')

    return modifiers
  }

  /*
    Is provided key modifier
  */
  _isModifier(key) {
    return MODIFIERS.indexOf(key) >= 0 // eslint-disable-line no-use-before-define
  }

  /*
    Get key number and returns name of key
  */
  _getKeyName(key) {
    return KEY_CODES[key]  // eslint-disable-line no-use-before-define
  }
}

const MODIFIERS = ['shift','ctrl','alt','meta','cmd','option']

// Key codes mapper

const KEY_CODES = {
  0: "\\",
  8: "backspace",
  9: "tab",
  12: "num",
  13: "enter",
  16: "shift",
  17: "ctrl",
  18: "alt",
  19: "pause",
  20: "caps",
  27: "esc",
  32: "space",
  33: "pageup",
  34: "pagedown",
  35: "end",
  36: "home",
  37: "left",
  38: "up",
  39: "right",
  40: "down",
  44: "print",
  45: "insert",
  46: "delete",
  48: "0",
  49: "1",
  50: "2",
  51: "3",
  52: "4",
  53: "5",
  54: "6",
  55: "7",
  56: "8",
  57: "9",
  65: "a",
  66: "b",
  67: "c",
  68: "d",
  69: "e",
  70: "f",
  71: "g",
  72: "h",
  73: "i",
  74: "j",
  75: "k",
  76: "l",
  77: "m",
  78: "n",
  79: "o",
  80: "p",
  81: "q",
  82: "r",
  83: "s",
  84: "t",
  85: "u",
  86: "v",
  87: "w",
  88: "x",
  89: "y",
  90: "z",
  91: "cmd",
  92: "cmd",
  93: "cmd",
  96: "num_0",
  97: "num_1",
  98: "num_2",
  99: "num_3",
  100: "num_4",
  101: "num_5",
  102: "num_6",
  103: "num_7",
  104: "num_8",
  105: "num_9",
  106: "num_multiply",
  107: "num_add",
  108: "num_enter",
  109: "num_subtract",
  110: "num_decimal",
  111: "num_divide",
  112: "f1",
  113: "f2",
  114: "f3",
  115: "f4",
  116: "f5",
  117: "f6",
  118: "f7",
  119: "f8",
  120: "f9",
  121: "f10",
  122: "f11",
  123: "f12",
  124: "print",
  144: "num",
  145: "scroll",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'",
  223: "`",
  224: "cmd",
  225: "alt",
  57392: "ctrl",
  63289: "num",
  59: ";",
  61: "=",
  173: "-"
}
