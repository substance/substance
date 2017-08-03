import { EventEmitter } from '../util'
import VirtualElement from './VirtualElement'

declare abstract class Component extends EventEmitter {

  /**
   * @param $$ factory method for creating elements
   * 
   * @example
   * ```
   * render($$) {
   *   let el = $$('div').addClass('sc-my-component')
   *   el.append('Hello World!')
   *   return el
   * }
   * ```
   */
  abstract render($$: createElement): VirtualElement;

}

// HACK: trying to achieve something like Class<? extends Component>
type Class<T> = { new(...args: any[]): T; };

/**
 * A factory method for creating VirtualElements.
 */
interface  createElement {
  (type: string | Class<Component>, props?: any): VirtualElement;
}

export { createElement };
export default Component;
