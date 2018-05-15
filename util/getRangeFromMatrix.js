export default function getRangeFromMatrix(cells, startRow, startCol, endRow, endCol, force2D) {
  if (!force2D) {
    if (startRow === endRow && startCol === endCol) {
      let row = cells[startCol]
      if (row) return row[endCol]
      else return undefined
    }
    if (startRow === endRow) {
      let row = cells[startRow]
      if (row) return row.slice(startCol, endCol+1)
      else return []
    }
    if (startCol === endCol) {
      let res = []
      for (let i = startRow; i <= endRow; i++) {
        let row = cells[i]
        if (row) res.push(row[startCol])
      }
      return res
    }
  }
  let res = []
  for (var i = startRow; i < endRow+1; i++) {
    let row = cells[i]
    if (row) res.push(row.slice(startCol, endCol+1))
  }
  return res
}
