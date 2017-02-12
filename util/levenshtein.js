export default function levenshtein(a, b){
  let m = []
  for(let i = 0; i <= b.length; i++) {
    m[i] = [i]
    if(i === 0) continue;
    let ib = i-1
    for(let j = 0; j <= a.length; j++){
      m[0][j] = j
      if(j === 0) continue;
      let jb = j-1
      m[i][j] = b.charAt(ib) === a.charAt(jb) ? m[ib][jb] : Math.min(
        m[ib][jb]+1,
        m[i][jb]+1,
        m[ib][j]+1
      )
    }
  }
  return m
}
