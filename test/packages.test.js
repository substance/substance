import { test } from 'substance-test'
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
  ToolbarPackage,
  Configurator
} from 'substance'

test('packages: import all packages', (t) => {
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
