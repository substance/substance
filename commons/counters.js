export const LATIN_LETTERS_LOWER_CASE = 'abcdefghijklmnopqrstuvwxyz'
export const LATIN_LETTERS_UPPER_CASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const ROMAN_NUMBERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI']
export const ARABIC_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
export const SYMBOLS = ((symbols, times) => {
  let res = []
  for (let n = 1; n <= times; n++) {
    for (let s of symbols) {
      res.push(new Array(n).fill(s).join(''))
    }
  }
  return res
})(['*', '†', '‡', '¶', '§', '‖', '#'], 4)
