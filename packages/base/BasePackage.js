import ButtonPackage from '../button/ButtonPackage'
import ContextMenuPackage from '../context-menu/ContextMenuPackage'
import GridPackage from '../grid/GridPackage'
import GutterPackage from '../gutter/GutterPackage'
import InputPackage from '../input/InputPackage'
import LayoutPackage from '../layout/LayoutPackage'
import ModalPackage from '../modal/ModalPackage'
import OverlayPackage from '../overlay/OverlayPackage'
import DropzonesPackage from '../dropzones/DropzonesPackage'
import ScrollbarPackage from '../scrollbar/ScrollbarPackage'
import ScrollPanePackage from '../scroll-pane/ScrollPanePackage'
import BodyScrollPanePackage from '../body-scroll-pane/BodyScrollPanePackage'
import SplitPanePackage from '../split-pane/SplitPanePackage'
import TabbedPanePackage from '../tabbed-pane/TabbedPanePackage'
import FilePackage from '../file/FilePackage'
import UndoCommand from './UndoCommand'
import RedoCommand from './RedoCommand'
import SelectAllCommand from './SelectAllCommand'
import ToolPanelPackage from '../tool-panel/ToolPanelPackage'
import IsolatedNodeComponent from '../../ui/IsolatedNodeComponent'
import InlineNodeComponent from '../../ui/InlineNodeComponent'
import AnnotationComponent from '../../ui/AnnotationComponent'

export default {
  name: 'base',
  configure: function (config) {
    config.import(FilePackage)
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
    config.import(DropzonesPackage)
    config.import(GutterPackage)
    config.import(ToolPanelPackage)

    // Commands
    config.addCommand('undo', UndoCommand, { commandGroup: 'undo-redo' })
    config.addCommand('redo', RedoCommand, { commandGroup: 'undo-redo' })
    config.addCommand('select-all', SelectAllCommand, { commandGroup: 'selection' })

    // Icons
    config.addIcon('insert', { 'fontawesome': 'fa-plus' })
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
    config.addLabel('select-all', {
      en: 'Select All',
      de: 'Alles Auswählen'
    })
    config.addLabel('text-types', {
      en: 'Text Type',
      de: 'Texttyp'
    })
    config.addLabel('container-selection', {
      en: 'Container',
      de: 'Container'
    })
    config.addLabel('@container', {
      en: 'Container',
      de: 'Container'
    })
    config.addLabel('insert', {
      en: 'Insert',
      de: 'Einfügen'
    })
    config.addLabel('insert-container', {
      en: 'Insert Container',
      de: 'Container einfügen'
    })

    config.addComponent('isolated-node', IsolatedNodeComponent)
    config.addComponent('inline-node', InlineNodeComponent)
    config.addComponent('annotation', AnnotationComponent)

    config.addKeyboardShortcut('CommandOrControl+Z', { command: 'undo' })
    config.addKeyboardShortcut('CommandOrControl+Shift+Z', { command: 'redo' })
    config.addKeyboardShortcut('CommandOrControl+A', { command: 'select-all' })
  },
  UndoCommand,
  RedoCommand,
  SelectAllCommand
}
