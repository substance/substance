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

Document.Schema = require('./document_schema');

Document.Node = require('./node');
Document.Annotation = require('./annotation');
Document.Container = require('./container');
Document.ContainerAnnotation = require('./container_annotation');
Document.TextNode = require('./text_node');

Document.Coordinate = require('./coordinate');
Document.Range = require('./range');
Document.Selection = require('./selection');
Document.nullSelection = Document.Selection.nullSelection;
Document.PropertySelection = require('./property_selection');
Document.ContainerSelection = require('./container_selection');
Document.TableSelection = require('./table_selection');

Document.Annotator = require('./annotator');
Document.AnnotationUpdates = require('./annotation_updates');

Document.HtmlImporter = require('./html_importer');
Document.HtmlExporter = require('./html_exporter');
Document.ClipboardImporter = require('./clipboard_importer');
Document.ClipboardExporter = require('./clipboard_exporter');

Document.Transformations = require('./transformations');

module.exports = Document;