import { test } from 'substance-test'
import { sanitizeHTML } from 'substance'

test('sanitizeHTML: strip <script> elements', t => {
  const html = '<div><script>alert()</script>foo</div>'
  const expected = '<div>foo</div>'
  const actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip HTML event hooks', t => {
  const html = '<div onclick="alert()">foo</div>'
  const expected = '<div>foo</div>'
  const actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

// mentioned on the HTML4 security cheatsheet (see https://html5sec.org/)
test('sanitizeHTML: strip form and formaction', t => {
  const html = '<form id="test"></form><button form="test" formaction="javascript:alert(1)">X</button>'
  const expected = '<form></form><button>X</button>'
  const actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip mathml', t => {
  const html = '<math href="javascript:alert(1)">CLICKME</math>'
  const expected = ''
  const actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip href with javascript', t => {
  const html = '<a href="javascript:alert()"></a>'
  const expected = '<a></a>'
  const actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip comments', t => {
  const html = '<!--<img src="--><img src=x onerror=alert(1)//">'
  const expected = '<img src="x">'
  const actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip CDATA', t => {
  const html = '<svg><![CDATA[><image xlink:href="]]><img src=xx:x onerror=alert(2)//"></svg>'
  const expected = '<svg><img src="xx:x"/></svg>'
  const actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: plain text obfuscation', t => {
  const html = '<style><img src="</style><img src=x onerror=alert(1)//"></img>'
  const expected = '<style><img src="</style><img src="x">'
  const actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})
