import { test as substanceTest } from 'substance-test'
import { platform, prettyPrintXML } from 'substance'

if (platform.inBrowser) {
  prettyPrintTests('BrowserDOMElement')
}

prettyPrintTests('MemoryDOMElement')

function prettyPrintTests (impl) {
  const LABEL = 'prettyPrintXML (' + impl + ')'
  const test = (title, fn) => substanceTest(`${LABEL}: ${title}`, t => {
    // before
    if (impl === 'MemoryDOMElement') platform.inBrowser = false
    try {
      fn(t)
    } finally {
      // after
      platform._reset()
    }
  })

  test('preserve XML declaration', t => {
    let xmlStr = `<?xml version="1.0" encoding="UTF-8"?><article />`
    let expected = `<?xml version="1.0" encoding="UTF-8"?>\n<article />`
    let actual = prettyPrintXML(xmlStr)
    t.equal(actual, expected, 'prettyPrinted XML should be correct')
    t.end()
  })

  test('preserve DOCTYPE declaration', t => {
    let xmlStr = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving DTD v1.0 20120330//EN" "JATS-journalarchiving.dtd"><article />`
    let expected = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving DTD v1.0 20120330//EN" "JATS-journalarchiving.dtd">\n<article />`
    let actual = prettyPrintXML(xmlStr)
    t.equal(actual, expected, 'prettyPrinted XML should be correct')
    t.end()
  })

  test('skip white-space outside the root element', t => {
    let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving DTD v1.0 20120330//EN" "JATS-journalarchiving.dtd">
      <article />`
    let expected = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving DTD v1.0 20120330//EN" "JATS-journalarchiving.dtd">\n<article />`
    let actual = prettyPrintXML(xmlStr)
    t.equal(actual, expected, 'prettyPrinted XML should be correct')
    t.end()
  })

  test('layout structural elements', t => {
    let xmlStr = `<?xml version="1.0" encoding="UTF-8"?><article><front><title /></front><body><p /></body><back><references /></back></article>`
    let actual = prettyPrintXML(xmlStr)
    let expected = `<?xml version="1.0" encoding="UTF-8"?>
<article>
  <front>
    <title />
  </front>
  <body>
    <p />
  </body>
  <back>
    <references />
  </back>
</article>`
    t.equal(actual, expected, 'prettyPrinted XML should be correct')
    t.end()
  })

  test('layout mixed elements', t => {
    let xmlStr = `<?xml version="1.0" encoding="UTF-8"?><article><front><title>Hello <b>World</b>!</title></front><body><p>Bla blupp</p></body></article>`
    let actual = prettyPrintXML(xmlStr)
    let expected = `<?xml version="1.0" encoding="UTF-8"?>
<article>
  <front>
    <title>Hello <b>World</b>!</title>
  </front>
  <body>
    <p>Bla blupp</p>
  </body>
</article>`
    t.equal(actual, expected, 'prettyPrinted XML should be correct')
    t.end()
  })
}
