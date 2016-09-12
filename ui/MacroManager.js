'use strict';

import oo from '../util/oo'

function MacroManager(context, macros) {
  this.context = context;
  this.macros = macros;
  this.context.documentSession.on('update', this.onUpdate, this);
}

MacroManager.Prototype = function() {

  this.onUpdate = function(update, info) {
    if (update.change) {
      this.executeMacros(update, info);
    }
  };

  this.executeMacros = function(update, info) {
    var change = update.change;
    if (!change) {
      return;
    }
    var doc = this.context.documentSession.getDocument();
    var nodeId, node, text;
    var path;
    if (info.action === 'type') {
      // HACK: we know that there is only one op when we type something
      var op = change.ops[0];
      path = op.path;
      nodeId = path[0];
      node = doc.get(nodeId);
      text = doc.get(path);
    } else {
      return;
    }

    var props = {
      action: info.action,
      node: node,
      path: path,
      text: text,
      selection: this.context.documentSession.getSelection()
    };
    for (var i = 0; i < this.macros.length; i++) {
      var macro = this.macros[i];
      var executed = macro.execute(props, this.context);

      if (executed) {
        break;
      }
    }
  };
};

oo.initClass(MacroManager);

export default MacroManager;
