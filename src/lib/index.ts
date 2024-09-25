// import { LimboArray } from "./LimboArray";
// import { LimboComponent } from "./LimboComponent";
// import { LimboModel, LimboModelFactory } from "./LimboModel";
// import { LimboNode } from "./LimboNode";

// export default {
//   LimboModelFactory,
//   LimboArray,
//   LimboNode,
//   LimboComponent,
// };

// export type { LimboModel };

import limboInstance, { LimboBootstrapOptions } from "./Limbo";
import { LimboComponent } from "./LimboComponent";

export { LimboComponent };

const Limbo = {
  LimboComponent,
  Bootstrap: (element: HTMLElement, options?: LimboBootstrapOptions) => limboInstance.bootstrap(element, options),
};
export default Limbo;

//export type { LimboModel };
