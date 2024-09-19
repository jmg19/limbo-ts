import { LimboArray } from "./LimboArray";
import { LimboComponent } from "./LimboComponent";
import { LimboLoop } from "./LimboLoop";
import { _LimboModel, LimboModel } from "./LimboModel";

const renderedComponents: { [key: string]: LimboComponent<unknown> } = {};
const renderedLoops: { [key: string]: LimboLoop } = {};
let aplicationComponents: { [key: string]: { new (componentId: string, model: unknown): unknown } };

const LimboCleaner = async () => {
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
  loopItemModel?: LimboModel<unknown>;
  modelPrefix?: string;
};

const LimboComponentsBootstrap = async (element: HTMLElement, options: LimboBootstrapOptions = {}) => {
  const modelPrefix = options.modelPrefix || "model";

  if (options.components) {
    aplicationComponents = options.components as { [key: string]: { new (componentId: string, model: unknown): unknown } };
  }

  bootstrapLoops(element, options, modelPrefix);

  bootstrapComponents(element, options);

  LimboCleaner();
};

export default LimboComponentsBootstrap;

function bootstrapLoops(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string) {
  const loopsToRender: Element[] = [];
  const loopElements = element.querySelectorAll("[data-limbo-loop]");

  loopElements.forEach((loopElement) => {
    let shouldRender = true;
    let parentElement = loopElement.parentElement;
    while (parentElement && parentElement !== element) {
      if (parentElement.getAttribute("data-limbo-component") || parentElement.getAttribute("data-limbo-loop")) {
        shouldRender = false;
        break;
      }
      parentElement = parentElement.parentElement;
    }

    if (shouldRender) {
      loopsToRender.push(loopElement);
    }
  });

  loopsToRender.forEach((loopToRender) => {
    const loopAlias = loopToRender.getAttribute("data-limbo-loop");
    const loopId = loopToRender.id || new Date().getTime().toString();

    if (!options.parentComponentModel) {
      console.error("Parent Component Model must exist.");
      return;
    }

    if (!loopAlias) {
      console.error("data-limbo-loop value should not be empty.");
      return;
    }

    if (renderedLoops[loopId]) {
      console.error(`Loop with id ${loopId} already rendered`);
      return;
    }

    if (!(options.parentComponentModel instanceof _LimboModel)) {
      console.error("Parent Component Model must be an instance of LimboModel.");
      return;
    }

    const regex = new RegExp(`{{(\\w+) of (${modelPrefix}\\..+)}}`, "g");
    const matches = [...loopAlias.matchAll(regex)];
    const itemName = matches[0][1];
    const modelReference = matches[0][2];

    const modelReferenceValue = options.parentComponentModel.getByModelReference(modelReference);

    if (!modelReferenceValue) {
      return;
    }

    if (!(modelReferenceValue instanceof LimboArray)) {
      console.error("modelReference", "Value must be an instance of LimboArray");
      return;
    }

    renderedLoops[loopId] = new LimboLoop(loopId, loopToRender as HTMLElement, itemName, modelReferenceValue as LimboArray<unknown>);
  });
}

function bootstrapComponents(element: HTMLElement, options: LimboBootstrapOptions) {
  const componentsToRender: Element[] = [];
  const limboComponentElements = element.querySelectorAll("[data-limbo-component]");

  limboComponentElements.forEach((limboComponentElement) => {
    let shouldRender = true;
    let parentElement = limboComponentElement.parentElement;
    while (parentElement && parentElement !== element) {
      if (parentElement.getAttribute("data-limbo-component") || parentElement.getAttribute("data-limbo-loop")) {
        shouldRender = false;
        break;
      }
      parentElement = parentElement.parentElement;
    }

    if (shouldRender) {
      componentsToRender.push(limboComponentElement);
    }
  });

  componentsToRender.forEach((documentToRender) => {
    const componentId = documentToRender.getAttribute("id");
    const componentName = documentToRender.getAttribute("data-limbo-component");

    if (!componentId) {
      console.error("Component must have an id attribute");
      return;
    }

    if (renderedComponents[componentId]) {
      console.info(`Component with id ${componentId} already rendered`);
      return;
    }

    if (!componentName) {
      console.error("Component Name must be defined in data-limbo-component attribute");
      return;
    }

    if (options.parentComponentModel && !(options.parentComponentModel instanceof _LimboModel)) {
      console.error("Parent Component Model must be an instance of LimboModel");
      console.log(options.parentComponentModel);
      return;
    }

    if (options.loopItemModel && !(options.loopItemModel instanceof _LimboModel)) {
      console.error("Loop Item Model must be an instance of LimboModel");
      console.log(options.loopItemModel);
      return;
    }

    if (typeof (aplicationComponents as { [key: string]: unknown })[componentName] === "function") {
      let model = undefined;
      if (options.parentComponentModel) {
        const modelReference = documentToRender.getAttribute("data-limbo-model") as string;
        model = options.parentComponentModel.getByModelReference(modelReference);
        if (!model) {
          return;
        }
      }

      if (options.loopItemModel) {
        model = options.loopItemModel;
      }

      const component = new aplicationComponents[componentName](componentId, model) as LimboComponent<unknown>;
      renderedComponents[componentId] = component;
    } else {
      console.error(`Implementation for Component ${componentName} was not found!`);
    }
  });
}
