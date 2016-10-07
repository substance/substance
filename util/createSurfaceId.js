export default function createSurfaceId(surface) {
  var surfaceParent = surface._getSurfaceParent();
  if (surfaceParent) {
    return surfaceParent.getId() + '/' + surface.name;
  } else {
    return surface.name;
  }
};
