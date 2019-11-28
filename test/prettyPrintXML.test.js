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
    if (impl === 'MemoryDOMElement') platform.values.inBrowser = false
    try {
      fn(t)
    } finally {
      // after
      platform._reset()
    }
  })

  test('preserve XML declaration', t => {
    const xmlStr = '<?xml version="1.0" encoding="UTF-8"?><article />'
    const expected = '<?xml version="1.0" encoding="UTF-8"?>\n<article />'
    const actual = prettyPrintXML(xmlStr)
    t.equal(actual, expected, 'prettyPrinted XML should be correct')
    t.end()
  })

  test('preserve DOCTYPE declaration', t => {
    const xmlStr = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving DTD v1.0 20120330//EN" "JATS-journalarchiving.dtd"><article />'
    const expected = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving DTD v1.0 20120330//EN" "JATS-journalarchiving.dtd">\n<article />'
    const actual = prettyPrintXML(xmlStr)
    t.equal(actual, expected, 'prettyPrinted XML should be correct')
    t.end()
  })

  test('skip white-space outside the root element', t => {
    const xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving DTD v1.0 20120330//EN" "JATS-journalarchiving.dtd">
      <article />`
    const expected = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving DTD v1.0 20120330//EN" "JATS-journalarchiving.dtd">\n<article />'
    const actual = prettyPrintXML(xmlStr)
    t.equal(actual, expected, 'prettyPrinted XML should be correct')
    t.end()
  })

  test('layout structural elements', t => {
    const xmlStr = '<?xml version="1.0" encoding="UTF-8"?><article><front><title /></front><body><p /></body><back><references /></back></article>'
    const actual = prettyPrintXML(xmlStr)
    const expected = `<?xml version="1.0" encoding="UTF-8"?>
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
    const xmlStr = '<?xml version="1.0" encoding="UTF-8"?><article><front><title>Hello <b>World</b>!</title></front><body><p>Bla blupp</p></body></article>'
    const actual = prettyPrintXML(xmlStr)
    const expected = `<?xml version="1.0" encoding="UTF-8"?>
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
