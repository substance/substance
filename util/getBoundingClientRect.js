'use strict';

var forEach = require('lodash/forEach');

/*
  TODO: This implementation is naive and not robust. See #584
*/
function _getBoundingClientRect(element, relativeEl) {
  var el = element;

  var _x = 0;
  var _y = 0;
  while (el && el != relativeEl && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
    _x += el.offsetLeft - el.scrollLeft + el.clientLeft;
    _y += el.offsetTop - el.scrollTop + el.clientTop;
    el = el.offsetParent;
  }
  return {
    top: _y,
    left: _x,
    width: element.offsetWidth,
    height: element.offsetHeight,
    right: relativeEl.offsetWidth - (_x+element.offsetWidth),
    bottom: relativeEl.offsetHeight - (_y+element.offsetHeight)
  };
}

/**
  Get bounding rectangle relative to a given parent element.

  Allows multiple elements being passed (we need this for selections that
  consist of multiple selection fragments) takes a relative parent element that
  is used as a reference point, instead of the browser's viewport.
*/
function getBoundingClientRect(els, containerEl) {
  if (els.length === undefined) {
    els = [els];
  }
  
  var bottom = 0;
  var top = Infinity;
  var right = 0;
  var left = Infinity;

  forEach(els, function(el) {
    var rect = _getBoundingClientRect(el, containerEl);
    bottom = Math.max(rect.bottom, bottom);
    top = Math.min(rect.top, top);
    left = Math.min(rect.left, left);
    right = Math.max(rect.right, right);
  });

  var containerWidth = containerEl.offsetWidth;
  var containerHeight = containerEl.offsetHeight;
  var height = containerHeight - top - bottom;
  var width = containerWidth - right - left;

  var res = {
    top: top, bottom: bottom,
    left: left, right: right,
    width: width, height: height
  };
  return res;
}

module.exports = getBoundingClientRect;