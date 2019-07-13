export default function createComponentContext (config) {
  return {
    componentRegistry: config.getComponentRegistry(),
    labelProvider: config.getLabelProvider(),
    iconProvider: config.getIconProvider()
  }
}
