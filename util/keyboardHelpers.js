export {default as keys} from './keys'

export function parseKeyEvent(event, onlyModifiers) {
  let frags = []
  if (event.altKey) {
    if (event.code === 'AltRight') {
      frags.push('ALTGR')
    } else {
      frags.push('ALT')
    }
  }
  if (event.ctrlKey) frags.push('CTRL')
  if (event.metaKey) frags.push('META')
  if (event.shiftKey) frags.push('SHIFT')
  if (!onlyModifiers) {
    frags.push(event.keyCode)
  }
  return frags.join('+')
}
