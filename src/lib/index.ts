import limboInstance, { LimboBootstrapOptions } from "./Limbo";
import { LimboComponent, LimboComponentOptions } from "./LimboComponent";

export { LimboComponent };
export type { LimboComponentOptions };

const Limbo = {
  LimboComponent,
  Bootstrap: (element: HTMLElement, options?: LimboBootstrapOptions) => limboInstance.bootstrap(element, options),
};
export default Limbo;
