'use strict';

import DefaultOverlay from '../../ui/DefaultOverlay'

function ProseEditorOverlay() {
  ProseEditorOverlay.super.apply(this, arguments);
}

ProseEditorOverlay.Prototype = function() {

  this.getClassNames = function() {
    return 'sc-prose-editor-overlay';
  };

};

DefaultOverlay.extend(ProseEditorOverlay);

export default ProseEditorOverlay;
