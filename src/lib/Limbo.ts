import { LimboArray } from "./LimboArray";
import { LimboComponent } from "./LimboComponent";
import { LimboCondition } from "./LimboCondition";
import { LimboLoop } from "./LimboLoop";
import { _LimboModel, LimboModel } from "./LimboModel";
import { LimboNode } from "./LimboNode";

export type LimboBootstrapOptions = {
  components?: unknown;
  parentComponentModel?: LimboModel<unknown>;
  loopItemModel?: LimboModel<unknown>;
  modelPrefix?: string;
};

class Limbo {
  static #instance: Limbo;

  private aplicationComponents: { [key: string]: { new (componentId: string, model: unknown): unknown } } = {};
  private renderedComponents: { [key: string]: LimboComponent<unknown> } = {};
  private renderedLoops: { [key: string]: LimboLoop } = {};
  private renderedConditions: { [key: string]: LimboCondition } = {};
  private generatedLimboNodes: { [key: string]: LimboNode[] } = {};

  private constructor() {}

  public static get instance(): Limbo {
    if (!Limbo.#instance) {
      Limbo.#instance = new Limbo();
    }

    return Limbo.#instance;
  }

  private async cleaner() {
    Object.keys(this.renderedComponents).forEach((componentId) => {
      const componentElement = document.getElementById(componentId);
      if (!componentElement) {
        this.clearLimboNodes(this.renderedComponents[componentId].limboNodesIds);
        delete this.renderedComponents[componentId];
      }
    });

    Object.keys(this.renderedLoops).forEach((loopId) => {
      const loopElement = document.getElementById(loopId);
      if (!loopElement) {
        for (const key in this.renderedLoops[loopId].limboNodesIds) {
          this.clearLimboNodes(this.renderedLoops[loopId].limboNodesIds[key]);
        }
        this.renderedLoops[loopId].detachFromModel();
        delete this.renderedLoops[loopId];
      }
    });

    Object.keys(this.renderedConditions).forEach((conditionId) => {
      const conditionElement = document.getElementById(conditionId);
      if (!conditionElement) {
        this.clearLimboNodes(this.renderedConditions[conditionId].limboNodesIds);
        delete this.renderedConditions[conditionId];
      }
    });
  }

  private bootstrapLoops(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string) {
    const loopsToRender: Element[] = [];
    const loopElements = element.querySelectorAll("[data-limbo-loop]");

    loopElements.forEach((loopElement) => {
      let shouldRender = true;
      let parentElement = loopElement.parentElement;
      while (parentElement && parentElement !== element) {
        if (
          parentElement.getAttribute("data-limbo-component") ||
          parentElement.getAttribute("data-limbo-loop") ||
          parentElement.getAttribute("data-limbo-loop-item") ||
          parentElement.getAttribute("data-limbo-condition") ||
          parentElement.getAttribute("data-limbo-condition-rendered")
        ) {
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
      const loopId = loopToRender.id || `loop-${new Date().getTime().toString()}`;

      if (!options.parentComponentModel) {
        console.error("Parent Component Model must exist.");
        return;
      }

      if (!loopAlias) {
        console.error("data-limbo-loop value should not be empty.");
        return;
      }

      if (this.renderedLoops[loopId]) {
        console.error(`Loop with id ${loopId} already rendered`);
        return;
      }

      if (!(options.parentComponentModel instanceof _LimboModel)) {
        console.error("Parent Component Model must be an instance of LimboModel.");
        return;
      }

      const regex = new RegExp(`{{(\\w+) of (${modelPrefix}\\..+)}}`, "g");
      const matches = [...loopAlias.matchAll(regex)];

      if (matches.length === 0 || matches[0].length !== 3) {
        console.error("data-limbo-loop value must be in the format {{itemName of modelReference}}");
        return;
      }

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

      this.renderedLoops[loopId] = new LimboLoop(loopId, loopToRender as HTMLElement, itemName, modelReferenceValue as LimboArray<unknown>);
    });
  }

  private bootstrapComponents(element: HTMLElement, options: LimboBootstrapOptions) {
    const componentsToRender: Element[] = [];
    const limboComponentElements = element.querySelectorAll("[data-limbo-component]");

    limboComponentElements.forEach((limboComponentElement) => {
      let shouldRender = true;
      let parentElement = limboComponentElement.parentElement;
      while (parentElement && parentElement !== element) {
        if (
          parentElement.getAttribute("data-limbo-component") ||
          parentElement.getAttribute("data-limbo-loop") ||
          parentElement.getAttribute("data-limbo-loop-item") ||
          parentElement.getAttribute("data-limbo-condition") ||
          parentElement.getAttribute("data-limbo-condition-rendered")
        ) {
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

      if (this.renderedComponents[componentId]) {
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

      if (typeof (this.aplicationComponents as { [key: string]: unknown })[componentName] === "function") {
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

        const component = new this.aplicationComponents[componentName](componentId, model) as LimboComponent<unknown>;
        this.renderedComponents[componentId] = component;
      } else {
        console.error(`Implementation for Component ${componentName} was not found!`);
      }
    });
  }

  private bootstrapLimboConditions(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string) {
    const conditionsToRender: Element[] = [];
    const conditionsElements = element.querySelectorAll("[data-limbo-condition]");

    conditionsElements.forEach((conditionElement) => {
      let shouldRender = true;
      let parentElement = conditionElement.parentElement;
      while (parentElement && parentElement !== element) {
        if (
          parentElement.getAttribute("data-limbo-component") ||
          parentElement.getAttribute("data-limbo-loop") ||
          parentElement.getAttribute("data-limbo-loop-item") ||
          parentElement.getAttribute("data-limbo-condition") ||
          parentElement.getAttribute("data-limbo-condition-rendered")
        ) {
          shouldRender = false;
          break;
        }
        parentElement = parentElement.parentElement;
      }

      if (shouldRender) {
        conditionsToRender.push(conditionElement);
      }
    });

    conditionsToRender.forEach((conditionToRender) => {
      const conditionAlias = conditionToRender.getAttribute("data-limbo-condition");
      const conditionId = conditionToRender.id || `condition-${new Date().getTime().toString()}`;

      if (!options.parentComponentModel) {
        console.error("Parent Component Model must exist.");
        return;
      }

      if (!conditionAlias) {
        console.error("data-limbo-loop value should not be empty.");
        return;
      }

      if (this.renderedConditions[conditionId]) {
        console.error(`Condition with id ${conditionId} already rendered`);
        return;
      }

      if (!(options.parentComponentModel instanceof _LimboModel)) {
        console.error("Parent Component Model must be an instance of LimboModel.");
        return;
      }

      const regex = new RegExp(`{{(${modelPrefix}\\..+) is (true|false)}}`, "g");
      const matches = [...conditionAlias.matchAll(regex)];

      if (matches.length === 0 || matches[0].length !== 3) {
        console.error("data-limbo-condition value must be in the format {{modelReference is true|false}}");
        return;
      }

      const modelReference = matches[0][1];
      const conditionalValue = matches[0][2] === "true";

      const modelReferenceValue = options.parentComponentModel.getByModelReference(modelReference);

      this.renderedConditions[conditionId] = new LimboCondition(
        conditionToRender as HTMLElement,
        conditionalValue,
        !!modelReferenceValue,
        conditionId,
        options.parentComponentModel,
        modelReference.replace(`${modelPrefix}`, options.parentComponentModel.getModelReference()),
      );
    });
  }

  public deBootstrap() {
    this.cleaner();
  }

  public async bootstrap(element: HTMLElement, options: LimboBootstrapOptions = {}) {
    const modelPrefix = options.modelPrefix || "model";

    if (options.components) {
      this.aplicationComponents = options.components as { [key: string]: { new (componentId: string, model: unknown): unknown } };
    }

    this.bootstrapLimboConditions(element, options, modelPrefix);

    this.bootstrapLoops(element, options, modelPrefix);

    this.bootstrapComponents(element, options);

    this.cleaner();
  }

  generateLimboNodes(modelName: string, html: string, htmlContainer: HTMLElement, rootReference: string, modelPrefix?: string): number[] {
    const limboNodesIds: number[] = [];
    const regex = new RegExp(`([a-zA-z-]+)="[^"]*(({{${modelName}\\..+}})|({{${modelName}}}))[^"]*"`, "g");
    const regexIt = html.matchAll(regex);

    for (const match of regexIt) {
      const attributeName = match[1];
      const modelReference = match[2];
      const limboKey = modelReference.replace(modelPrefix || "model", rootReference);

      const selectorString = `[${attributeName}*="${modelReference}"]`;
      const node = htmlContainer.querySelector(selectorString) as HTMLElement;

      if (node) {
        if (!this.generatedLimboNodes[limboKey]) {
          this.generatedLimboNodes[limboKey] = [];
        }

        if (attributeName !== "data-limbo-model" && attributeName !== "data-limbo-loop" && attributeName !== "data-limbo-condition") {
          const limboNode = new LimboNode({
            node,
            modelReferenceInView: modelReference,
            rootReference,
            attributeNameToReplaceValue: attributeName,
            modelPrefix,
          });
          limboNodesIds.push(limboNode.id);
          this.generatedLimboNodes[limboKey].push(limboNode);
        }
      }
    }

    const treeWalker = document.createTreeWalker(htmlContainer, NodeFilter.SHOW_TEXT, (node) => {
      const textNodeRegex = new RegExp(`{{${modelName}\\..+}}|{{${modelName}}}`, "g");
      const result = textNodeRegex.test((node as Text).textContent || "");
      return result ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    });

    let currentNode = treeWalker.nextNode();
    while (currentNode) {
      const node = currentNode as Text;

      if (node.textContent) {
        const textNodeRegex = new RegExp(`{{${modelName}\\..+}}|{{${modelName}}}`, "g");
        const matchResult = node.textContent.match(textNodeRegex);

        if (matchResult && matchResult.length > 0) {
          const modelReference = matchResult[0];
          const limboKey = modelReference.replace(modelPrefix || "model", rootReference);

          if (!this.generatedLimboNodes[limboKey]) {
            this.generatedLimboNodes[limboKey] = [];
          }

          const limboNode = new LimboNode({
            node,
            modelReferenceInView: modelReference,
            rootReference,
            isTextNode: true,
            modelPrefix,
          });

          limboNodesIds.push(limboNode.id);

          this.generatedLimboNodes[limboKey].push(limboNode);
        }
      }
      currentNode = treeWalker.nextNode();
    }

    return limboNodesIds;
  }

  updateLimboNodes(
    modelReference: string,
    value: number | boolean | string | ((...params: unknown[]) => string | number | boolean) | undefined | null,
  ) {
    if (this.generatedLimboNodes[modelReference]) {
      this.generatedLimboNodes[modelReference].forEach((limboNode) => {
        if (typeof value === "function") {
          limboNode.value = (value as (...params: unknown[]) => string | number | boolean)();
        } else {
          limboNode.value = value === 0 ? value : value || "";
        }
      });
    }
  }

  clearLimboNodes(limboNodesIds: number[]) {
    for (const limboKey in this.generatedLimboNodes) {
      this.generatedLimboNodes[limboKey] = this.generatedLimboNodes[limboKey].filter((limboNode) => !limboNodesIds.includes(limboNode.id));
    }
  }
}

export default Limbo.instance;
