'use strict';

/**
 * Substance.Document
 * ==================
 *
 * TODO: add more description here
 *
 * @module Document
 */
var Document = require('./Document');

Document.Schema = require('./DocumentSchema');

Document.Node = require('./DocumentNode');
Document.Annotation = require('./Annotation');
Document.Container = require('./Container');
Document.ContainerAnnotation = require('./ContainerAnnotation');
Document.TextNode = require('./TextNode');

Document.Coordinate = require('./Coordinate');
Document.Range = require('./Range');
Document.Selection = require('./Selection');
Document.nullSelection = Document.Selection.nullSelection;
Document.PropertySelection = require('./PropertySelection');
Document.ContainerSelection = require('./ContainerSelection');
Document.TableSelection = require('./TableSelection');

Document.Annotator = require('./Annotator');
Document.AnnotationUpdates = require('./annotation_updates');

Document.HtmlImporter = require('./HtmlImporter');
Document.HtmlExporter = require('./HtmlExporter');
Document.ClipboardImporter = require('./ClipboardImporter');
Document.ClipboardExporter = require('./ClipboardExporter');

Document.Transformations = require('./transformations');

module.exports = Document;