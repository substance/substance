import { module } from 'substance-test'
import {
  BasePackage,
  BlockquotePackage,
  BodyScrollPanePackage,
  ButtonPackage,
  CodePackage,
  CodeblockPackage,
  ContextMenuPackage,
  DropzonesPackage,
  EmphasisPackage,
  FilePackage,
  FindAndReplacePackage,
  GridPackage,
  GutterPackage,
  HeadingPackage,
  ImagePackage,
  InlineWrapperPackage,
  InputPackage,
  LayoutPackage,
  LinkPackage,
  ListPackage,
  ModalPackage,
  OverlayPackage,
  ParagraphPackage,
  PersistencePackage,
  ProseEditorPackage,
  QuoteMarksPackage,
  ScrollPanePackage,
  ScrollbarPackage,
  SpellCheckPackage,
  SplitPanePackage,
  StrongPackage,
  SubscriptPackage,
  SuperscriptPackage,
  TabbedPanePackage,
  TablePackage,
  TextInputPackage,
  ToolbarPackage,
  Configurator
} from 'substance'

const test = module('packages')

test('import all packages', (t) => {
  [
    BasePackage,
    BlockquotePackage,
    BodyScrollPanePackage,
    ButtonPackage,
    CodePackage,
    CodeblockPackage,
    ContextMenuPackage,
    DropzonesPackage,
    EmphasisPackage,
    FilePackage,
    FindAndReplacePackage,
    HeadingPackage,
    ImagePackage,
    InputPackage,
    LinkPackage,
    ListPackage,
    ModalPackage,
    OverlayPackage,
    ParagraphPackage,
    PersistencePackage,
    ProseEditorPackage,
    QuoteMarksPackage,
    ScrollPanePackage,
    ScrollbarPackage,
    SpellCheckPackage,
    SplitPanePackage,
    StrongPackage,
    SubscriptPackage,
    SuperscriptPackage,
    TabbedPanePackage,
    TablePackage,
    TextInputPackage,
    ToolbarPackage
  ].forEach((p) => {
    t.doesNotThrow(() => {
      let configurator = new Configurator()
      configurator.import(p)
    })
  })
  t.end()
})
