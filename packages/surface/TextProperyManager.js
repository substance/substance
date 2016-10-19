/*
  This class is used to register TextPropertyComponents
  and dispatch updates in an efficient manner, i.e. avoiding unnecessary rerenderings

  There are different situations when TextPropertComponents need to be rerendered, which can occur at the same time:
  - the text property is updated
  - selection fragments are updated (local selection is blurred)
  - markers change (e.g. spell check)
  - container annotation fragments need to be rendered

*/
class TextProperyManager {

  constructor(documentSession) {
    // text property components stored via path
    this.textPropertyComponents = {}

    this.documentSession = documentSession
  }

  getTextPropertyComponent(path) {
    return this.textPropertyComponents[path]
  }

  registerTextProperty(textPropertyComponent) {
    let path = textPropertyComponent.getPath()
    this.textPropertyComponents[path] = textPropertyComponent
  }

  unregisterTextProperty(textPropertyComponent) {
    let path = textPropertyComponent.getPath()
    if (this.textPropertyComponents[path] === textPropertyComponent) {
      delete this.textPropertyComponents[path]
    }
  }

}