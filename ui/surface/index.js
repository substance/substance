/**
 * Substance Surface is a generic interface for web-based content editors.
 * It provides pre-implemented classes for form editors and container editors.
 *
 * @module ui/surface
 */

var surface = {};

surface.Surface = require('./surface');
surface.FormEditor = require('./form_editor');
surface.ContainerEditor = require('./container_editor');
surface.Clipboard = require('./clipboard');

module.exports = surface;