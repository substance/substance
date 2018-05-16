export default function printStacktrace () {
  try {
    throw new Error()
  } catch (err) {
    console.error(err.stack)
  }
}
