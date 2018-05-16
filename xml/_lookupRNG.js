export default function _lookupRNG (fs, searchDirs, file) {
  for (let i = 0; i < searchDirs.length; i++) {
    let absPath = searchDirs[i] + '/' + file
    if (fs.existsSync(absPath)) {
      return absPath
    }
  }
}
