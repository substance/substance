export default function printStacktrace() {
  try {
    throw new Error();
  } catch (err) {
    console.log(err.stack);
  }
}