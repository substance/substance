import Selection from './Selection'
import PropertySelection from './PropertySelection'
import ContainerSelection from './ContainerSelection'
import NodeSelection from './NodeSelection'
import CustomSelection from './CustomSelection'

export function fromJSON(json) {
  if (!json) return Selection.nullSelection;
  var type = json.type;
  switch(type) {
    case 'property':
      return PropertySelection.fromJSON(json);
    case 'container':
      return ContainerSelection.fromJSON(json);
    case 'node':
      return NodeSelection.fromJSON(json);
    case 'custom':
      return CustomSelection.fromJSON(json);
    default:
      // console.error('Selection.fromJSON(): unsupported selection data', json);
      return Selection.nullSelection;
  }
}
