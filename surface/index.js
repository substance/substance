
var Surface = require('./surface');
Surface.SurfaceManager = require('./surface_manager');
Surface.SurfaceSelection = require('./surface_selection');

Surface.FormEditor = require('./form_editor');
Surface.ContainerEditor = require('./container_editor');
Surface.Clipboard = require('./clipboard');

Surface.NodeView = require('./node_view');
Surface.AnnotationView = require('./annotation_view');
Surface.TextProperty = require('./text_property');

Surface.Tool = require('./tool');
Surface.AnnotationTool = require('./annotation_tool');
Surface.SwitchTypeTool = require('./switch_type_tool');
Surface.ToolRegistry = require('./tool_registry');
Surface.Panel = require('./panel');

Surface.Tools = require('./tools');

module.exports = Surface;
