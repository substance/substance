import Component from './Component'
import VirtualElement from './VirtualElement'

// workaround for a deficiency in Typescript: looking for something like Class<? extends Component> in Java
type Class<T> = { new(...args: any[]): T; };

/**
 * A factory method for creating VirtualElements.
 * 
 * see {@link Component.render}
 */
export interface  createElement {
  (type: string | Class<Component>, props?: any): VirtualElement;
}
