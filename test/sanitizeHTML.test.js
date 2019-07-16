import { test } from 'substance-test'
import { sanitizeHTML } from 'substance'

test('sanitizeHTML: strip <script> elements', t => {
  let html = '<div><script>alert()</script>foo</div>'
  let expected = '<div>foo</div>'
  let actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip HTML event hooks', t => {
  let html = '<div onclick="alert()">foo</div>'
  let expected = '<div>foo</div>'
  let actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

// mentioned on the HTML4 security cheatsheet (see https://html5sec.org/)
test('sanitizeHTML: strip form and formaction', t => {
  let html = '<form id="test"></form><button form="test" formaction="javascript:alert(1)">X</button>'
  let expected = '<form></form><button>X</button>'
  let actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip mathml', t => {
  let html = '<math href="javascript:alert(1)">CLICKME</math>'
  let expected = ''
  let actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip href with javascript', t => {
  let html = '<a href="javascript:alert()"></a>'
  let expected = '<a></a>'
  let actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip comments', t => {
  let html = '<!--<img src="--><img src=x onerror=alert(1)//">'
  let expected = '<img src="x">'
  let actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: strip CDATA', t => {
  let html = '<svg><![CDATA[><image xlink:href="]]><img src=xx:x onerror=alert(2)//"></svg>'
  let expected = '<svg><img src="xx:x"/></svg>'
  let actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})

test('sanitizeHTML: plain text obfuscation', t => {
  let html = '<style><img src="</style><img src=x onerror=alert(1)//"></img>'
  let expected = '<style><img src="</style><img src="x">'
  let actual = sanitizeHTML(html)
  t.equal(actual, expected, 'html should be sanitized correctly')
  t.end()
})
