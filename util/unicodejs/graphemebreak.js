/*
  Borrowed from https://git.wikimedia.org/git/unicodejs.git.

  Copyright (c) 2013–2015 UnicodeJS team and others under the terms
  of The MIT License (MIT), as follows:

  This software consists of voluntary contributions made by many
  individuals (AUTHORS.txt) For exact contribution history, see the
  revision history and logs, available at https://gerrit.wikimedia.org

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var property, disjunction, graphemeBreakRegexp,
  unicodeJS = require('./unicodejs_common'),
  properties = require('./graphemebreakproperties'),
  oneCharacter = '[^\\ud800-\\udfff]|[\\ud800-\\udbff][\\udc00-\\udfff]',
  graphemebreak = {},
  patterns = {};

// build regexes
for ( property in properties ) {
  patterns[ property ] = unicodeJS.charRangeArrayRegexp( properties[ property ] );
}

// build disjunction for grapheme cluster split
// See http://www.unicode.org/reports/tr29/ at "Grapheme Cluster Boundary Rules"
disjunction = [
  // Break at the start and end of text.
  // GB1: sot ÷
  // GB2: ÷ eot
  // GB1 and GB2 are trivially satisfied

  // Do not break between a CR and LF. Otherwise, break before and after controls.
  // GB3: CR × LF
  '\\r\\n',

  // GB4: ( Control | CR | LF ) ÷
  // GB5: ÷ ( Control | CR | LF )
  patterns.Control,

  // Do not break Hangul syllable sequences.
  // GB6: L × ( L | V | LV | LVT )
  // GB7: ( LV | V ) × ( V | T )
  // GB8: ( LVT | T ) × T
  '(?:' + patterns.L + ')*' +
  '(?:' + patterns.V + ')+' +
  '(?:' + patterns.T + ')*',

  '(?:' + patterns.L + ')*' +
  '(?:' + patterns.LV + ')' +
  '(?:' + patterns.V + ')*' +
  '(?:' + patterns.T + ')*',

  '(?:' + patterns.L + ')*' +
  '(?:' + patterns.LVT + ')' +
  '(?:' + patterns.T + ')*',

  '(?:' + patterns.L + ')+',

  '(?:' + patterns.T + ')+',

  // Do not break between regional indicator symbols.
  // GB8a: Regional_Indicator × Regional_Indicator
  '(?:' + patterns.RegionalIndicator + ')+',

  // Do not break before extending characters.
  // GB9: × Extend

  // Only for extended grapheme clusters:
  // Do not break before SpacingMarks, or after Prepend characters.
  // GB9a: × SpacingMark
  // GB9b: Prepend ×
  // As of Unicode 7.0.0, no characters are "Prepend"
  // TODO: this will break if the extended thing is not oneCharacter
  // e.g. hangul jamo L+V+T. Does it matter?
  '(?:' + oneCharacter + ')' +
  '(?:' + patterns.Extend + '|' +
  patterns.SpacingMark + ')+',

  // Otherwise, break everywhere.
  // GB10: Any ÷ Any
  // Taking care not to split surrogates
  oneCharacter
];
graphemeBreakRegexp = new RegExp( '(' + disjunction.join( '|' ) + ')' );

/**
 * Split a string into grapheme clusters.
 *
 * @param {string} text Text to split
 * @return {string[]} Array of clusters
 */
graphemebreak.splitClusters = function ( text ) {
  var i, parts, length, clusters = [];
  parts = text.split( graphemeBreakRegexp );
  for ( i = 0, length = parts.length; i < length; i++ ) {
    if ( parts[ i ] !== '' ) {
      clusters.push( parts[ i ] );
    }
  }
  return clusters;
};

module.exports = graphemebreak;
