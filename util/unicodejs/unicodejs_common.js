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

function splitCharacters( text ) {
  return text.split( /(?![\uDC00-\uDFFF])/g );
  // TODO: think through handling of invalid UTF-16
}

function uEsc( codeUnit ) {
  return '\\u' + ( codeUnit + 0x10000 ).toString( 16 ).slice( -4 );
}

function codeUnitRange( min, max, bracket ) {
  var value;
  if ( min === max ) { // single code unit: never bracket
    return uEsc( min );
  }
  value = uEsc( min ) + '-' + uEsc( max );
  if ( bracket ) {
    return '[' + value + ']';
  } else {
    return value;
  }
}

function getCodeUnitBoxes( ch1, ch2 ) {
  var loMin, loMax, hi1, hi2, lo1, lo2, boxes, hiMinAbove, hiMaxBelow;
  // min and max lo surrogates possible in UTF-16
  loMin = 0xDC00;
  loMax = 0xDFFF;

  // hi and lo surrogates for ch1
  /* jslint bitwise: true */
  hi1 = 0xD800 + ( ( ch1 - 0x10000 ) >> 10 );
  lo1 = 0xDC00 + ( ( ch1 - 0x10000 ) & 0x3FF );

  // hi and lo surrogates for ch2
  hi2 = 0xD800 + ( ( ch2 - 0x10000 ) >> 10 );
  lo2 = 0xDC00 + ( ( ch2 - 0x10000 ) & 0x3FF );
  /* jslint bitwise: false */

  if ( hi1 === hi2 ) {
    return [ { hi: [ hi1, hi2 ], lo: [ lo1, lo2 ] } ];
  }

  boxes = [];

  /* jslint bitwise: true */
  // minimum hi surrogate which only represents characters >= ch1
  hiMinAbove = 0xD800 + ( ( ch1 - 0x10000 + 0x3FF ) >> 10 );
  // maximum hi surrogate which only represents characters <= ch2
  hiMaxBelow = 0xD800 + ( ( ch2 - 0x10000 - 0x3FF ) >> 10 );
  /* jslint bitwise: false */

  if ( hi1 < hiMinAbove ) {
    boxes.push( { hi: [ hi1, hi1 ], lo: [ lo1, loMax ] } );
  }
  if ( hiMinAbove <= hiMaxBelow ) {
    boxes.push( { hi: [ hiMinAbove, hiMaxBelow ], lo: [ loMin, loMax ] } );
  }
  if ( hiMaxBelow < hi2 ) {
    boxes.push( { hi: [ hi2, hi2 ], lo: [ loMin, lo2 ] } );
  }
  return boxes;
}

function charRangeArrayRegexp( ranges ) {
  var i, j, min, max, hi, lo, range, box,
    boxes = [],
    characterClass = [], // list of (\uXXXX code unit or interval), for BMP
    disjunction = []; // list of regex strings, to be joined with '|'

  for ( i = 0; i < ranges.length; i++ ) {
    range = ranges[ i ];
    // Handle single code unit
    if ( typeof range === 'number' && range <= 0xFFFF ) {
      if ( range >= 0xD800 && range <= 0xDFFF ) {
        throw new Error( 'Surrogate: ' + range.toString( 16 ) );
      }
      if ( range > 0x10FFFF ) {
        throw new Error( 'Character code too high: ' +
          range.toString( 16 ) );
      }
      characterClass.push( uEsc( range ) );
      continue;
    }

    // Handle single surrogate pair
    if ( typeof range === 'number' && range > 0xFFFF ) {
      /* jslint bitwise: true */
      hi = 0xD800 + ( ( range - 0x10000 ) >> 10 );
      lo = 0xDC00 + ( ( range - 0x10000 ) & 0x3FF );
      /* jslint bitwise: false */
      disjunction.push( uEsc( hi ) + uEsc( lo ) );
      continue;
    }

    // Handle interval
    min = range[ 0 ];
    max = range[ 1 ];
    if ( min > max ) {
      throw new Error( min.toString( 16 ) + ' > ' + max.toString( 16 ) );
    }
    if ( max > 0x10FFFF ) {
      throw new Error( 'Character code too high: ' +
        max.toString( 16 ) );
    }
    if ( max >= 0xD800 && min <= 0xDFFF ) {
      throw new Error( 'range includes surrogates: ' +
        min.toString( 16 ) + '-' + max.toString( 16 ) );
    }
    if ( max <= 0xFFFF ) {
      // interval is entirely BMP
      characterClass.push( codeUnitRange( min, max ) );
    } else if ( min <= 0xFFFF && max > 0xFFFF ) {
      // interval is BMP and non-BMP
      characterClass.push( codeUnitRange( min, 0xFFFF ) );
      boxes = getCodeUnitBoxes( 0x10000, max );
    } else if ( min > 0xFFFF ) {
      // interval is entirely non-BMP
      boxes = getCodeUnitBoxes( min, max );
    }

    // append hi-lo surrogate space boxes as code unit range pairs
    for ( j = 0; j < boxes.length; j++ ) {
      box = boxes[ j ];
      hi = codeUnitRange( box.hi[ 0 ], box.hi[ 1 ], true );
      lo = codeUnitRange( box.lo[ 0 ], box.lo[ 1 ], true );
      disjunction.push( hi + lo );
    }
  }

  // prepend BMP character class to the disjunction
  if ( characterClass.length === 1 && !characterClass[ 0 ].match( /-/ ) ) {
    disjunction.unshift( characterClass[ 0 ] ); // single character
  } else if ( characterClass.length > 0 ) {
    disjunction.unshift( '[' + characterClass.join( '' ) + ']' );
  }
  return disjunction.join( '|' );
}

module.exports = {
  charRangeArrayRegexp: charRangeArrayRegexp,
  splitCharacters: splitCharacters
};
