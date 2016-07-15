'use strict';

// Note: in iron-node window is defined - but it has window.process
// which is not there in a real browser env
var inBrowser = ( typeof window !== 'undefined');

module.exports = inBrowser;
