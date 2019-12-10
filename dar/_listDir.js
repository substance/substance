const fs = require('fs')
const path = require('path')
const DOT = '.'.charCodeAt(0)

/*
  Retrieves a list of entries recursively, including file names and stats.
*/
export default async function listDir (dir, opts = {}) {
  return new Promise((resolve, reject) => {
    _list(dir, opts, (err, records) => {
      if (err) reject(err)
      else resolve(records)
    })
  })
}

function _list (dir, opts, done) {
  let results = []
  fs.readdir(dir, (err, list) => {
    if (err) return done(err)
    let pending = list.length
    if (!pending) return done(null, results)
    function _continue () {
      if (!--pending) done(null, results)
    }
    list.forEach((name) => {
      if (opts.ignoreDotFiles && name.charCodeAt(0) === DOT) {
        return _continue()
      }
      const absPath = path.resolve(dir, name)
      fs.stat(absPath, (err, stat) => {
        if (err) return done(err)
        if (stat && stat.isDirectory()) {
          _list(name, opts, (err, res) => {
            if (err) return done(err)
            results = results.concat(res)
            _continue()
          })
        } else {
          results.push(Object.assign({}, stat, {
            name,
            path: absPath
          }))
          _continue()
        }
      })
    })
  })
}
