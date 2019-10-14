import IsolatedNodeComponent from './IsolatedNodeComponent'

export default class OpenIsolatedNodeComponent extends IsolatedNodeComponent {
  constructor (parent, props, options) {
    super(parent, props, options)
    // HACK: overriding 'closed' IsolatedNodeComponents per se
    // TODO: on the long term we need to understand if it may be better to open
    // IsolatedNodes by default and only close them if needed.
    // The UX is improved much also in browsers like FF.
    // Still we need to evaluate this decision in the near future.
    this.blockingMode = 'open'
  }
}
