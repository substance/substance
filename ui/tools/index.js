/**
 * Tools are small visual components to trigger commands. Developers
 * are encouraged to implement their own. Substance provides a number of 
 * pre-implemented tools, that you can use to build a customized toolbar.
 * 
 * @example
 *
 * var UndoTool = require('substance/ui/tools/undo_tool');
 * var RedoTool = require('substance/ui/tools/redo_tool');
 * var TextTool = require('substance/ui/tools/text_tool');
 * var StrongTool = require('substance/ui/tools/strong_tool');
 * var EmphasisTool = require('substance/ui/tools/emphasis_tool');
 * var LinkTool = require('substance/ui/tools/link_tool');
 * 
 * var MyToolbar = Component.extend({
 *   render: function() {
 *     var el = $$('div').addClass('toolbar');
 *     el.append(
 *       $$(TextTool, {'title': this.i18.t('switch_text')}),
 *       $$(UndoTool).append($$(Icon, {icon: "fa-undo"})),
 *       $$(RedoTool).append($$(Icon, {icon: "fa-repeat"})),
 *       $$(StrongTool).append($$(Icon, {icon: "fa-bold"})),
 *       $$(EmphasisTool).append($$(Icon, {icon: "fa-italic"})),
 *       $$(LinkTool).append($$(Icon, {icon: "fa-link"}))
 *     );
 *     return el;
 *   }
 * });
 * 
 * @module ui/tools 
 */