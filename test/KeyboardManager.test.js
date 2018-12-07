import { test } from 'substance-test'
import { KeyboardManager } from 'substance'

test('KeyboardManager: parseCombo(A)', (t) => {
  let combo = KeyboardManager.parseCombo('A')
  t.equal(combo, '65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo() is case-invariant', (t) => {
  let combo1 = KeyboardManager.parseCombo('A')
  let combo2 = KeyboardManager.parseCombo('a')
  t.equal(combo1, combo2, 'both combos should be the same')
  t.end()
})

test('KeyboardManager: parseCombo(Ctrl+A)', (t) => {
  let combo = KeyboardManager.parseCombo('Ctrl+A')
  t.equal(combo, 'CTRL+65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo() should be invariant regarding order of modifiers', (t) => {
  let combo1 = KeyboardManager.parseCombo('Ctrl+Shift+A')
  let combo2 = KeyboardManager.parseCombo('Shift+Ctrl+A')
  t.equal(combo1, combo2, 'both combos should be the same')
  t.end()
})

test('KeyboardManager: parseCombo(Alt+A)', (t) => {
  let combo = KeyboardManager.parseCombo('Alt+A')
  t.equal(combo, 'ALT+65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(AltGr+A)', (t) => {
  let combo = KeyboardManager.parseCombo('AltGr+A')
  t.equal(combo, 'ALTGR+65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(Cmd+A)', (t) => {
  let combo = KeyboardManager.parseCombo('Cmd+A')
  t.equal(combo, 'META+65', 'combo should be parsed correctly')
  t.end()
})

/* TODO we need to implement parseKeyEvent for these
test('KeyboardManager: parseCombo(MediaNextTrack)', (t) => {
  let combo = KeyboardManager.parseCombo('MediaNextTrack')
  t.equal(combo, 'MEDIANEXTTRACK', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(MediaPlayPause)', (t) => {
  let combo = KeyboardManager.parseCombo('MediaPlayPause')
  t.equal(combo, 'MEDIAPLAYPAUSE', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(MediaPreviousTrack)', (t) => {
  let combo = KeyboardManager.parseCombo('MediaPreviousTrack')
  t.equal(combo, 'MEDIAPREVIOUSTRACK', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(MediaStop)', (t) => {
  let combo = KeyboardManager.parseCombo('MediaStop')
  t.equal(combo, 'MEDIASTOP', 'combo should be parsed correctly')
  t.end()
})
*/

test('KeyboardManager: parseCombo(Shift+A)', (t) => {
  let combo = KeyboardManager.parseCombo('Shift+A')
  t.equal(combo, 'SHIFT+65', 'combo should be parsed correctly')
  t.end()
})

test('KeyboardManager: parseCombo(Super+A)', (t) => {
  let combo = KeyboardManager.parseCombo('Super+A')
  t.equal(combo, 'META+65', 'combo should be parsed correctly')
  t.end()
})
