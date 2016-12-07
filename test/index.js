// model
import "./model/ContainerAddress.test.js"
import "./model/ContainerSelection.test.js"
import "./model/copySelection.test.js"
import "./model/Document.test.js"
import "./model/annotationHelpers.test.js"
import "./model/documentHelpers.test.js"
import "./model/Editing.test.js"
import "./model/EditorSession.test.js"
import "./model/Fragmenter.test.js"
import "./model/HTMLExporter.test.js"
import "./model/HTMLImporter.test.js"
import "./model/OperationSerializer.test.js"
import "./model/paste.test.js"
import "./model/PathEventProxy.test.js"
import "./model/XMLExporter.test.js"
import "./model/XMLImporter.test.js"

// ui
import "./ui/AnnotationCommand.test.js"
import "./ui/Clipboard.test.js"
import "./ui/Component.integration.test.js"
import "./ui/Component.test.js"
import "./ui/DOMElement.test.js"
import "./ui/DOMSelection.test.js"
import "./ui/InlineNode.test.js"
import "./ui/IsolatedNode.test.js"
import "./ui/RenderingEngine.test.js"
import "./ui/Surface.test.js"
import "./ui/TextPropertyComponent.test.js"

// util
import "./util/TreeIndex.test.js"

// collab
import "./collab/ChangeStore.test.js"
// import "./collab/CollabEngine.test.js"
// TODO: these two are broken... some tests do not finish
// import "./model/DocumentEngine.test.js"
import "./collab/DocumentStore.test.js"
import "./collab/SnapshotEngine.test.js"
import "./collab/SnapshotStore.test.js"
