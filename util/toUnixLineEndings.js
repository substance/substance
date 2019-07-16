export default function toUnixLineEndings (str) {
  return str.replace(/\r?\n/g, '\n')
}
