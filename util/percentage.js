'use strict';

module.exports = function percentage(ratio) {
  return String(Math.floor(ratio*100*100)/100) + ' %';
};
