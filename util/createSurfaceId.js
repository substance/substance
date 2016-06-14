'use strict';

module.exports = function createSurfaceId(surface) {
  var surfaceParent = surface._getSurfaceParent();
  if (surfaceParent) {
    // HACK: we want simpler ids for cases where we just nest
    // containers
    if (surface._isContainerEditor && surfaceParent._isIsolatedNodeComponent) {
      return surfaceParent.getId();
    }
    return surfaceParent.getId() + '/' + surface.name;
  } else {
    return surface.name;
  }
};
