export default function getRangeFromMatrix (cells, startRow, startCol, endRow, endCol, force2D) {
  if (!force2D) {
    if (startRow === endRow && startCol === endCol) {
      const row = cells[startCol]
      if (row) return row[endCol]
      else return undefined
    }
    if (startRow === endRow) {
      const row = cells[startRow]
      if (row) return row.slice(startCol, endCol + 1)
      else return []
    }
    if (startCol === endCol) {
      const res = []
      for (let i = startRow; i <= endRow; i++) {
        const row = cells[i]
        if (row) res.push(row[startCol])
      }
      return res
    }
  }
  const res = []
  for (var i = startRow; i < endRow + 1; i++) {
    const row = cells[i]
    if (row) res.push(row.slice(startCol, endCol + 1))
  }
  return res
}
