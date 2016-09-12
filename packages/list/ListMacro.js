'use strict';

import switchTextType from '../../model/transform/switchTextType'
import deleteSelection from '../../model/transform/deleteSelection'

var ListMacro = {

  appliesTo: ['paragraph'],

  execute: function(props, context) {
    if (this.appliesTo.indexOf(props.node.type) === -1) {
      return false;
    }
    var match = /^\*\s/.exec(props.text);

    if (match) {
      var surface = context.surfaceManager.getSurface(props.selection.surfaceId);
      surface.transaction(function(tx, args) {
        var deleteSel = tx.createSelection(props.path, 0, match[0].length);
        deleteSelection(tx, {
          selection: deleteSel
        });
        var switchTextResult = switchTextType(tx, {
          selection: props.selection,
          containerId: args.containerId,
          data: {
            type: 'list-item'
          }
        });
        if (props.action === 'type') {
          return {
            selection: tx.createSelection(switchTextResult.node.getTextPath(), 0)
          };
        }
      });
      return true;
    }
  }

};

export default ListMacro;
