/*
  A wrapper for native DOM events when using event delegation via
  `DOMElement.on(eventName, selector, handler)`.

  @param [Component] owner
  @param [Element] selectedTarget native DOM element
  @param [Event] originalEvent native DOM event
*/
function DelegatedEvent(owner, selectedTarget, originalEvent) {
  this.owner = owner;
  this.target = selectedTarget;
  this.originalEvent = originalEvent;
}

export default DelegatedEvent
