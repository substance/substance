import { test } from 'substance-test'
import { parseKeyCombo, parseKeyEvent } from 'substance'

test('KeyboardManager: parseCombo(A)', (t) => {
  const combo = parseKeyEvent(parseKeyCombo('A'))
  t.equal(combo, '65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo() is case-invariant', (t) => {
  const combo1 = parseKeyEvent(parseKeyCombo('A'))
  const combo2 = parseKeyEvent(parseKeyCombo('a'))
  t.equal(combo1, combo2, 'both combos should be the same')
  t.end()
})

test('KeyboardManager: parseCombo(Ctrl+A)', (t) => {
  const combo = parseKeyEvent(parseKeyCombo('Ctrl+A'))
  t.equal(combo, 'CTRL+65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo() should be invariant regarding order of modifiers', (t) => {
  const combo1 = parseKeyEvent(parseKeyCombo('Ctrl+Shift+A'))
  const combo2 = parseKeyEvent(parseKeyCombo('Shift+Ctrl+A'))
  t.equal(combo1, combo2, 'both combos should be the same')
  t.end()
})

test('KeyboardManager: parseCombo(Alt+A)', (t) => {
  const combo = parseKeyEvent(parseKeyCombo('Alt+A'))
  t.equal(combo, 'ALT+65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(AltGr+A)', (t) => {
  const combo = parseKeyEvent(parseKeyCombo('AltGr+A'))
  t.equal(combo, 'ALTGR+65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(Cmd+A)', (t) => {
  const combo = parseKeyEvent(parseKeyCombo('Cmd+A'))
  t.equal(combo, 'META+65', 'combo should be parsed correctly')
  t.end()
})

/* TODO we need to implement parseKeyEvent for these
test('KeyboardManager: parseCombo(MediaNextTrack)', (t) => {
  let combo = parseKeyEvent(parseKeyCombo('MediaNextTrack'))
  t.equal(combo, 'MEDIANEXTTRACK', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(MediaPlayPause)', (t) => {
  let combo = parseKeyEvent(parseKeyCombo('MediaPlayPause'))
  t.equal(combo, 'MEDIAPLAYPAUSE', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(MediaPreviousTrack)', (t) => {
  let combo = parseKeyEvent(parseKeyCombo('MediaPreviousTrack'))
  t.equal(combo, 'MEDIAPREVIOUSTRACK', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(MediaStop)', (t) => {
  let combo = parseKeyEvent(parseKeyCombo('MediaStop'))
  t.equal(combo, 'MEDIASTOP', 'combo should be parsed correctly')
  t.end()
})
*/

test('KeyboardManager: parseCombo(Shift+A)', (t) => {
  const combo = parseKeyEvent(parseKeyCombo('Shift+A'))
  t.equal(combo, 'SHIFT+65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(Super+A)', (t) => {
  const combo = parseKeyEvent(parseKeyCombo('Super+A'))
  t.equal(combo, 'META+65', 'combo should be parsed correctly')
  t.end()
})
