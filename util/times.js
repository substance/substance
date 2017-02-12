export default function times(num, fn, ctx) {
  for (let i=0; i<num; i++) {
    fn.call(ctx)
  }
}
