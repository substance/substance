/*
  Run the functions in the tasks collection in series.

  NOTE: You can not access results of the executed functions
*/
export function series(tasks, cb, i) {
  i = i || 0
  tasks[i](function(err) {
    // Always stop execution on error
    if (err) return cb(err)
    if (i === tasks.length-1) {
      cb(...arguments) // we are done
    } else {
      series(tasks, cb, i + 1)
    }
  })
}