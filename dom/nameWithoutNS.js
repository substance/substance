export default function nameWithoutNS (name) {
  const idx = name.indexOf(':')
  if (idx > 0) {
    return name.slice(idx + 1)
  } else {
    return name
  }
}
