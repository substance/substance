import UndoCommand from './UndoCommand'
import RedoCommand from './RedoCommand'

import Tool from '../tools/Tool'

import BlockerPackage from '../blocker/BlockerPackage'
import ButtonPackage from '../button/ButtonPackage'
import ContextMenuPackage from '../context-menu/ContextMenuPackage'
import GridPackage from '../grid/GridPackage'
import GutterPackage from '../gutter/GutterPackage'
import InputPackage from '../input/InputPackage'
import LayoutPackage from '../layout/LayoutPackage'
import ModalPackage from '../modal/ModalPackage'
import OverlayPackage from '../overlay/OverlayPackage'
import ScrollbarPackage from '../scrollbar/ScrollbarPackage'
import ScrollPanePackage from '../scroll-pane/ScrollPanePackage'
import BodyScrollPanePackage from '../body-scroll-pane/BodyScrollPanePackage'
import SplitPanePackage from '../split-pane/SplitPanePackage'
import SwitchTextTypePackage from '../switch-text-type/SwitchTextTypePackage'
import TabbedPanePackage from '../tabbed-pane/TabbedPanePackage'

export default {
  name: 'base',
  configure: function(config) {
    config.import(BlockerPackage)
    config.import(SwitchTextTypePackage)
    config.import(ScrollPanePackage)
    config.import(BodyScrollPanePackage)
    config.import(SplitPanePackage)
    config.import(TabbedPanePackage)
    config.import(ScrollbarPackage)
    config.import(GridPackage)
    config.import(ModalPackage)
    config.import(InputPackage)
    config.import(ButtonPackage)
    config.import(LayoutPackage)
    config.import(ContextMenuPackage)
    config.import(OverlayPackage)
    config.import(GutterPackage)

    // Setup base toolgroups
    config.addToolGroup('document')
    config.addToolGroup('annotations')
    config.addToolGroup('default')
    config.addToolGroup('context-menu-primary')
    config.addToolGroup('context-menu-document')
    config.addToolGroup('insert')

    // Commands
    config.addCommand('undo', UndoCommand)
    config.addCommand('redo', RedoCommand)

    // Tools
    config.addTool('undo', Tool, {toolGroup: ['document', 'context-menu-document']})
    config.addTool('redo', Tool, {toolGroup: ['document', 'context-menu-document']})

    // Icons
    config.addIcon('undo', { 'fontawesome': 'fa-undo' })
    config.addIcon('redo', { 'fontawesome': 'fa-repeat' })
    config.addIcon('edit', { 'fontawesome': 'fa-cog' })
    config.addIcon('delete', { 'fontawesome': 'fa-times' })
    config.addIcon('expand', { 'fontawesome': 'fa-arrows-h' })
    config.addIcon('truncate', { 'fontawesome': 'fa-arrows-h' })

    // Labels
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
