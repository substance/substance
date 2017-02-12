import isString from './isString'
import levenshtein from './levenshtein'

/*
  Determines a list of changes to transform String a into String b.

  @param {String} a
  @param {String} b
*/
function diff(a, b, offset) {
  if (!isString(a) || !isString(b)) {
    throw new Error('Illegal arguments.')
  }
  offset = offset || 0
  let changes = []
  if (a || b) {
    if (!a && b) {
      changes.push({ type:'insert', start:offset, text:b })
    } else if (a && !b) {
      changes.push({ type:'delete', start:offset, end:offset+a.length })
    } else {
      let m = levenshtein(a, b)
      changes = _diff(a, b, m, offset)
    }
  }
  return changes
}

function _diff(a, b, m, offset) {
  let i = b.length
  let j = a.length
  let changes = []
  let current
  while (i>0 && j>0) {
    _next()
  }
  _commit()
  return changes

  function _next() {
    let d = m[i][j]
    let ib = i-1
    let jb = j-1
    // substitute
    if (m[ib][jb]<d) {
      if (current && current.type === 'replace') {
        current.start--
        current.text.unshift(b.charAt(ib))
      } else {
        _commit()
        current = { type:'replace', start:jb, end:j, text:[b.charAt(ib)] }
      }
      i--
      j--
    }
    // insert
    else if (m[ib][j]<d) {
      if (current && current.type === 'insert') {
        current.start--
        current.text.unshift(b.charAt(ib))
      } else {
        _commit()
        current = { type:'insert', start:jb, text:[b.charAt(ib)] }
      }
      i--
    }
    // delete char
    else if (m[i][jb]<d) {
      if (current && current.type === 'delete') {
        current.start--
      } else {
        _commit()
        current = { type:'delete', start:jb, end:j }
      }
      j--
    }
    // preserve
    else {
      _commit()
      i--
      j--
    }
  }

  function _commit() {
    if (current) {
      switch (current.type) {
        case 'insert':
          current.start += offset
          current.text = current.text.join('')
          break
        case 'delete':
          current.start += offset
          current.end += offset
          break
        case 'replace':
          current.start += offset
          current.end += offset
          current.text = current.text.join('')
          break
        default:
          throw new Error('Invalid state')
      }
      changes.push(current)
      current = null
    }
  }

}

export default diff
