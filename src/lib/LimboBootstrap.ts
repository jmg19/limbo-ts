import { LimboComponent } from "./LimboComponent";
import { LimboLoop } from "./LimboLoop";
import { LimboModel } from "./LimboModel";

const renderedComponents: { [key: string]: LimboComponent<unknown> } = {};
const renderedLoops: { [key: string]: LimboLoop } = {};
let aplicationComponents: unknown;

const LimboCleaner = () => {
  Object.keys(renderedComponents).forEach((componentId) => {
    const componentElement = document.getElementById(componentId);
    if (!componentElement) {
      delete renderedComponents[componentId];
    }
  });
};

type LimboBootstrapOptions = {
  components?: unknown;
  parentComponentModel?: LimboModel<unknown>;
};

const LimboComponentsBootstrap = (element: HTMLElement, options: LimboBootstrapOptions = {}) => {
  if (options.components) {
    aplicationComponents = options.components;
  }
  const documentsToRender = element.querySelectorAll("[data-limbo-component]");
  documentsToRender.forEach((documentToRender) => {
    const componentId = documentToRender.getAttribute("id");
    const componentName = documentToRender.getAttribute("data-limbo-component");

    if (!componentId) {
      console.error("Component must have an id attribute");
      return;
    }

    if (renderedComponents[componentId]) {
      console.error(`Component with id ${componentId} already rendered`);
      return;
    }

    if (!componentName) {
      console.error("Component Name must be defined in data-limbo-component attribute");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (aplicationComponents as any)[componentName] === "function") {
      let model = undefined;
      if (options.parentComponentModel) {
        const modelReference = documentToRender.getAttribute("data-limbo-model") as string;
        model = options.parentComponentModel.getByModelReference(modelReference);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const component = new (aplicationComponents as any)[componentName](componentId, model) as LimboComponent<unknown>;
      renderedComponents[componentId] = component;
    } else {
      console.error(`Implementation for Component ${componentName} was not found!`);
    }
  });

  // const loopsToRender = element.querySelectorAll("[data-limbo-loop]");
  // loopsToRender.forEach((loopToRender) => {
  //   const loopAlias = loopToRender.getAttribute("data-limbo-loop");
  //   if (!options.parentComponentModel) {
  //     console.error("Parent Component Model not found...");
  //     return;
  //   }

  //   if (!loopAlias) {
  //     console.error("data-limbo-loop value should not be empty...");
  //     return;
  //   }

  //   const matches = [...loopAlias.matchAll(/{{(\w+) of (model.\..+)}}"/g)];
  //   const itemName = matches[0][1];
  //   const modelReference = matches[0][2];
  //   const modelReferenceValue = options.parentComponentModel.getByModelReference(modelReference);

  //   if (!Array.isArray(modelReferenceValue)) {
  //     console.error("Loop value must be an array...");
  //     return;
  //   }

  //   modelReferenceValue.forEach((item, index) => {});
  // });

  LimboCleaner();
};

export default LimboComponentsBootstrap;
