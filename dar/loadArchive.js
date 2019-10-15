import DocumentArchive from './DocumentArchive'
import InMemoryDarBuffer from './InMemoryDarBuffer'

export default function loadArchive (rawArchive, config) {
  const archive = new DocumentArchive(
    // Note: this is a minimalistic Storage adapter with only `read()` implemented
    {
      read (_, cb) {
        cb(null, rawArchive)
      }
    },
    new InMemoryDarBuffer(),
    {},
    config
  )
  // Note: we are using a synchronous store here (in memory)
  // so this is actually synchronous
  archive.load(null, err => {
    if (err) {
      console.error(err)
    }
  })
  return archive
}
