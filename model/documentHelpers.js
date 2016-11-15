import isString from 'lodash/isString'
import filter from 'lodash/filter'
import DocumentIndex from './DocumentIndex'
import Selection from './Selection'

/**
  Some helpers for working with Documents.

  @module
  @example

  ```js
  import { documentHelpers } from 'substance'
  documentHelpers.isContainerAnnotation(doc, 'comment')
  ```
*/
const documentHelpers = {};

/**
  @param {Document} doc
  @param {String} type
  @return {Boolean} `true` if given type is a {@link ContainerAnnotation}
*/
documentHelpers.isContainerAnnotation = function(doc, type) {
  var schema = doc.getSchema();
  return schema.isInstanceOf(type, 'container-annotation');
};

/**
  For a given selection get all property annotations

  @param {Document} doc
  @param {Selection} sel
  @return {PropertyAnnotation[]} An array of property annotations.
          Returns an empty array when selection is a container selection.
*/
documentHelpers.getPropertyAnnotationsForSelection = function(doc, sel, options) {
  options = options || {};
  if (!sel.isPropertySelection()) {
    return [];
  }
  var path = doc.getRealPath(sel.path)
  var annotations = doc.getIndex('annotations').get(path, sel.startOffset, sel.endOffset);
  if (options.type) {
    annotations = filter(annotations, DocumentIndex.filterByType(options.type));
  }
  return annotations;
};

/**
  For a given selection get all container annotations

  @param {Document} doc
  @param {Selection} sel
  @param {String} containerId
  @param {String} options.type provides only annotations of that type
  @return {Array} An array of container annotations
*/
documentHelpers.getContainerAnnotationsForSelection = function(doc, sel, containerId, options) {
  // ATTENTION: looking for container annotations is not as efficient as property
  // selections, as we do not have an index that has notion of the spatial extend
  // of an annotation. Opposed to that, common annotations are bound
  // to properties which make it easy to lookup.
  if (!containerId) {
    throw new Error("'containerId' is required.");
  }
  options = options || {};
  var index = doc.getIndex('container-annotations');
  var annotations = index.get(containerId, options.type);
  annotations = filter(annotations, function(anno) {
    return sel.overlaps(anno.getSelection());
  });
  return annotations;
};

/**
  For a given selection, get annotations of a certain type

  @param {Document} doc
  @param {Selection} sel
  @param {string} annotationType
  @param {string} containerId (only needed when type is a container annotation)
  @return {array} all matching annotations
*/
documentHelpers.getAnnotationsForSelection = function(doc, sel, annotationType, containerId) {
  var annos;
  var isContainerAnno = documentHelpers.isContainerAnnotation(doc, annotationType);

  if (isContainerAnno) {
    var container = doc.get(containerId, 'strict');
    annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, container, {
      type: annotationType
    });
  } else {
    annos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel, { type: annotationType });
  }
  return annos;
};

/**
  For a given selection, get the corresponding text string

  @param {Document} doc
  @param {Selection} sel
  @return {string} text enclosed by the annotation
*/
documentHelpers.getTextForSelection = function(doc, sel) {
  var text;
  if (!sel || sel.isNull()) {
    return "";
  } else if (sel.isPropertySelection()) {
    text = doc.get(sel.start.path);
    return text.substring(sel.start.offset, sel.end.offset);
  } else if (sel.isContainerSelection()) {
    var result = [];
    var fragments = sel.getFragments();
    fragments.forEach(function(fragment) {
      if (fragment instanceof Selection.Fragment) {
        var text = doc.get(fragment.path);
        if (isString(text)) {
          result.push(
            text.substring(fragment.startOffset, fragment.endOffset)
          );
        }
      }
    });
    return result.join('\n');
  }
};

documentHelpers.getMarkersForSelection = function(doc, sel) {
  // only PropertySelections are supported right now
  if (!sel || !sel.isPropertySelection()) return []
  const path = doc.getRealPath(sel.getPath())
  // markers are stored as one hash for each path, grouped by marker key
  let markers = doc.getIndex('markers').get(path)
  const filtered = filter(markers, function(m) {
    return m.isInsideOf(sel)
  })
  return filtered
}

export default documentHelpers;