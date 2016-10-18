import UndoCommand from './UndoCommand'
import RedoCommand from './RedoCommand'
import CopyCommand from './CopyCommand'
import PasteCommand from './PasteCommand'

import Tool from '../tools/Tool'
import ToolGroup from '../tools/ToolGroup'

import ScrollPanePackage from '../scroll-pane/ScrollPanePackage'
import SplitPanePackage from '../split-pane/SplitPanePackage'
import TabbedPanePackage from '../tabbed-pane/TabbedPanePackage'
import ScrollbarPackage from '../scrollbar/ScrollbarPackage'
import GridPackage from '../grid/GridPackage'
import ModalPackage from '../modal/ModalPackage'
import InputPackage from '../input/InputPackage'
import ButtonPackage from '../button/ButtonPackage'
import SwitchTextTypePackage from '../switch-text-type/SwitchTextTypePackage'
import LayoutPackage from '../layout/LayoutPackage'
import ContextMenuPackage from '../context-menu/ContextMenuPackage'

export default {
  name: 'base',
  configure: function(config) {
    config.import(SwitchTextTypePackage)
    config.import(ScrollPanePackage)
    config.import(SplitPanePackage)
    config.import(TabbedPanePackage)
    config.import(ScrollbarPackage)
    config.import(GridPackage)
    config.import(ModalPackage)
    config.import(InputPackage)
    config.import(ButtonPackage)
    config.import(LayoutPackage)
    config.import(ContextMenuPackage)

    // Register predefined tool-targets (text, document)
    config.addComponent('tool-target-text', ToolGroup)
    config.addComponent('tool-target-document', ToolGroup)

    // Commands
    config.addCommand('undo', UndoCommand)
    config.addCommand('redo', RedoCommand)
    config.addCommand('copy', CopyCommand)
    config.addCommand('paste', PasteCommand)

    // Tools
    config.addTool('undo', Tool, {target: 'document'})
    config.addTool('redo', Tool, {target: 'document'})
    // config.addTool('copy', Tool, {target: 'context-menu'})
    // config.addTool('paste', Tool, {target: 'context-menu'})


    // Icons
    config.addIcon('undo', { 'fontawesome': 'fa-undo' })
    config.addIcon('redo', { 'fontawesome': 'fa-repeat' })
    config.addIcon('edit', { 'fontawesome': 'fa-cog' })
    config.addIcon('delete', { 'fontawesome': 'fa-times' })
    config.addIcon('expand', { 'fontawesome': 'fa-arrows-h' })
    config.addIcon('truncate', { 'fontawesome': 'fa-arrows-h' })

    // Labels
    config.addLabel('copy', {
      en: 'Copy',
      de: 'Kopieren'
    })
    config.addLabel('paste', {
      en: 'Paste',
      de: 'Einfügen'
    })
    config.addLabel('undo', {
      en: 'Undo',
      de: 'Rückgängig'
    })
    config.addLabel('redo', {
      en: 'Redo',
      de: 'Wiederherstellen'
    })
    config.addLabel('container-selection', {
      en: 'Container',
      de: 'Container'
    })
    config.addLabel('container', {
      en: 'Container',
      de: 'Container'
    })
    config.addLabel('insert-container', {
      en: 'Insert Container',
      de: 'Container einfügen'
    })
  }
}
