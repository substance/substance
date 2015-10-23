'use strict';

/**
 * Substance.Document
 * ==================
 *
 * TODO: add more description here
 *
 * @module Document
 */
var Document = require('./document');

Document.Schema = require('./DocumentSchema');

Document.Node = require('./node');
Document.Annotation = require('./annotation');
Document.Container = require('./container');
Document.ContainerAnnotation = require('./ContainerAnnotation');
Document.TextNode = require('./TextNode');

Document.Coordinate = require('./coordinate');
Document.Range = require('./range');
Document.Selection = require('./selection');
Document.nullSelection = Document.Selection.nullSelection;
Document.PropertySelection = require('./PropertySelection');
Document.ContainerSelection = require('./ContainerSelection');
Document.TableSelection = require('./TableSelection');

Document.Annotator = require('./annotator');
Document.AnnotationUpdates = require('./annotation_updates');

Document.HtmlImporter = require('./HtmlImporter');
Document.HtmlExporter = require('./HtmlExporter');
Document.ClipboardImporter = require('./ClipboardImporter');
Document.ClipboardExporter = require('./ClipboardExporter');

Document.Transformations = require('./transformations');

module.exports = Document;