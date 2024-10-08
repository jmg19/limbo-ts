import "./Limbo.css";
import { LimboArray } from "./LimboArray";
import { LimboComponent } from "./LimboComponent";
import { LimboCondition } from "./LimboCondition";
import { LimboLoop } from "./LimboLoop";
import { _LimboModel, LimboModel } from "./LimboModel";
import { LimboNode } from "./LimboNode";
import { LimboSwitch } from "./LimboSwitch";

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
  private renderedSwitches: { [key: string]: LimboSwitch } = {};
  private limboConditionsByReferece: { [key: string]: LimboCondition[] } = {};
  private limboSwitchesByReferece: { [key: string]: LimboSwitch[] } = {};
  private limboLoopsByReferece: { [key: string]: LimboLoop[] } = {};
  private limboComponentsByReferece: { [key: string]: LimboComponent<unknown>[] } = {};
  private generatedLimboNodes: { [key: string]: LimboNode[] } = {};
  private pendingLogic: (() => void)[] = [];

  private constructor() {}

  public static get instance(): Limbo {
    if (!Limbo.#instance) {
      Limbo.#instance = new Limbo();
    }

    return Limbo.#instance;
  }

  private cleaner() {
    Object.keys(this.renderedComponents).forEach((componentId) => {
      const componentElement = document.getElementById(componentId);
      if (!componentElement) {
        this.clearLimboNodes(this.renderedComponents[componentId].limboNodesIds);
        for (const key in this.limboComponentsByReferece) {
          this.limboComponentsByReferece[key] = this.limboComponentsByReferece[key].filter(
            (component) => component !== this.renderedComponents[componentId],
          );
        }
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
        for (const key in this.limboLoopsByReferece) {
          this.limboLoopsByReferece[key] = this.limboLoopsByReferece[key].filter((limboLoop) => limboLoop !== this.renderedLoops[loopId]);
        }
        delete this.renderedLoops[loopId];
      }
    });

    Object.keys(this.renderedConditions).forEach((conditionId) => {
      const conditionElement = document.getElementById(conditionId);
      if (!conditionElement) {
        this.clearLimboNodes(this.renderedConditions[conditionId].limboNodesIds);
        this.renderedConditions[conditionId].detachFromModel();
        for (const key in this.limboConditionsByReferece) {
          this.limboConditionsByReferece[key] = this.limboConditionsByReferece[key].filter(
            (condition) => condition !== this.renderedConditions[conditionId],
          );
        }
        delete this.renderedConditions[conditionId];
      }
    });

    Object.keys(this.renderedSwitches).forEach((switchId) => {
      const switchElement = document.getElementById(switchId);
      if (!switchElement) {
        this.clearLimboNodes(this.renderedSwitches[switchId].limboNodesIds);
        this.renderedSwitches[switchId].detachFromModel();
        for (const key in this.limboSwitchesByReferece) {
          this.limboSwitchesByReferece[key] = this.limboSwitchesByReferece[key].filter(
            (limboSwitch) => limboSwitch !== this.renderedSwitches[switchId],
          );
        }
        delete this.renderedConditions[switchId];
      }
    });
  }

  private isLimboElement(parentElement: HTMLElement) {
    return (
      parentElement.getAttribute("data-limbo-component") ||
      parentElement.getAttribute("data-limbo-loop") ||
      parentElement.getAttribute("data-limbo-loop-item") ||
      parentElement.getAttribute("data-limbo-condition") ||
      parentElement.getAttribute("data-limbo-condition-rendered") ||
      parentElement.getAttribute("data-limbo-switch") ||
      parentElement.getAttribute("data-limbo-switch-case") ||
      parentElement.getAttribute("data-limbo-switch-default") ||
      parentElement.getAttribute("data-limbo-switch-rendered")
    );
  }

  private bootstrapLimboLoops(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string) {
    const loopElements = element.querySelectorAll("[data-limbo-loop]");
    const loopsToRender: Element[] = this.filterElementsTorender(loopElements, element);

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

  private bootstrapLimboComponents(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string) {
    const limboComponentElements = element.querySelectorAll("[data-limbo-component]");
    const componentsToRender: Element[] = this.filterElementsTorender(limboComponentElements, element);

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
        let modelFullReference = documentToRender.getAttribute("data-limbo-model") as string;

        if (options.parentComponentModel) {
          model = options.parentComponentModel.getByModelReference(modelFullReference);

          modelFullReference = modelFullReference.replace("{{", "").replace("}}", "");
          modelFullReference = modelFullReference.replace(`${modelPrefix}`, options.parentComponentModel.getModelReference());
        }

        if (options.loopItemModel) {
          model = options.loopItemModel;
          modelFullReference = options.loopItemModel.getModelReference();
        }

        const component = new this.aplicationComponents[componentName](componentId, {
          model,
          alias: modelFullReference,
        }) as LimboComponent<unknown>;
        this.renderedComponents[componentId] = component;
        this.attachComponentToModelReference(modelFullReference, component);
      } else {
        console.error(`Implementation for Component ${componentName} was not found!`);
      }
    });
  }

  private bootstrapLimboSwitches(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string) {
    const switchElements = element.querySelectorAll("[data-limbo-switch]");
    const switchesToRender: Element[] = this.filterElementsTorender(switchElements, element);

    switchesToRender.forEach((switchElement) => {
      const switchAlias = switchElement.getAttribute("data-limbo-switch");
      const switchId = switchElement.id || `switch-${new Date().getTime().toString()}`;

      if (!options.parentComponentModel) {
        console.error("Parent Component Model must exist.");
        return;
      }

      if (!switchAlias) {
        console.error("data-limbo-switch value should not be empty.");
        return;
      }

      if (this.renderedSwitches[switchId]) {
        console.error(`Switch with id ${switchId} already rendered`);
        return;
      }

      if (!(options.parentComponentModel instanceof _LimboModel)) {
        console.error("Parent Component Model must be an instance of LimboModel.");
        return;
      }

      const regex = new RegExp(`{{(${modelPrefix}\\..+)}}`, "g");
      const matches = [...switchAlias.matchAll(regex)];

      if (matches.length === 0 || matches[0].length !== 2) {
        console.error("data-limbo-switch value must be in the format {{modelReference}}");
        return;
      }

      const modelReference = matches[0][1];
      const modelFullReference = modelReference.replace(`${modelPrefix}`, options.parentComponentModel.getModelReference());

      this.renderedSwitches[switchId] = new LimboSwitch(
        switchElement as HTMLElement,
        switchId,
        options.parentComponentModel,
        modelFullReference,
      );
      this.attachSwitchToModelReference(modelFullReference, this.renderedSwitches[switchId]);
    });
  }

  private bootstrapLimboConditions(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string) {
    const conditionsElements = element.querySelectorAll("[data-limbo-condition]");
    const conditionsToRender: Element[] = this.filterElementsTorender(conditionsElements, element);

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
      const modelFullReference = modelReference.replace(`${modelPrefix}`, options.parentComponentModel.getModelReference());

      this.renderedConditions[conditionId] = new LimboCondition(
        conditionToRender as HTMLElement,
        conditionalValue,
        !!modelReferenceValue,
        conditionId,
        options.parentComponentModel,
        modelFullReference,
      );
      this.attachConditionToModelReference(modelFullReference, this.renderedConditions[conditionId]);
    });
  }

  public deBootstrap() {
    this.cleaner();
  }

  public bootstrap(element: HTMLElement, options: LimboBootstrapOptions = {}) {
    const modelPrefix = options.modelPrefix || "model";

    if (options.components) {
      this.aplicationComponents = options.components as { [key: string]: { new (componentId: string, model: unknown): unknown } };
    }

    this.bootstrapLimboSwitches(element, options, modelPrefix);

    this.bootstrapLimboConditions(element, options, modelPrefix);

    this.bootstrapLimboLoops(element, options, modelPrefix);

    this.bootstrapLimboComponents(element, options, modelPrefix);

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

        if (this.attributeIsNotLimboElement(attributeName)) {
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

  private attributeIsNotLimboElement(attributeName: string) {
    return (
      attributeName !== "data-limbo-model" &&
      attributeName !== "data-limbo-loop" &&
      attributeName !== "data-limbo-condition" &&
      attributeName !== "data-limbo-condition-rendered" &&
      attributeName !== "data-limbo-loop-item" &&
      attributeName !== "data-limbo-component" &&
      attributeName !== "data-limbo-switch" &&
      attributeName !== "data-limbo-switch-case" &&
      attributeName !== "data-limbo-switch-default" &&
      attributeName !== "data-limbo-switch-rendered"
    );
  }

  private filterElementsTorender(elements: NodeListOf<Element>, element: HTMLElement): Element[] {
    const elementsToRender: Element[] = [];

    elements.forEach((switchElement) => {
      let shouldRender = true;
      let parentElement = switchElement.parentElement;
      while (parentElement && parentElement !== element) {
        if (this.isLimboElement(parentElement)) {
          shouldRender = false;
          break;
        }
        parentElement = parentElement.parentElement;
      }

      if (shouldRender) {
        elementsToRender.push(switchElement);
      }
    });

    return elementsToRender;
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

  attachModelToComponents(limboModel: _LimboModel<unknown>) {
    const modelReference = limboModel.getModelReference();
    if (this.limboComponentsByReferece[modelReference]) {
      this.limboComponentsByReferece[modelReference].forEach((component) => {
        component.attachModel(limboModel);
      });
    }
  }

  attachArrayToLoops(limboArray: LimboArray<unknown>) {
    const arrayReference = limboArray.getArrayReference();
    if (this.limboLoopsByReferece[arrayReference]) {
      this.limboLoopsByReferece[arrayReference].forEach((limboLoop) => {
        limboLoop.attachArray(limboArray);
      });
    }
  }

  attachComponentToModelReference(modelFullReference: string, component: LimboComponent<unknown>) {
    if (!this.limboComponentsByReferece[modelFullReference]) {
      this.limboComponentsByReferece[modelFullReference] = [];
    }

    this.limboComponentsByReferece[modelFullReference].push(component);
  }

  detachComponentToModelReference(modelFullReference: string, componentToRemove: LimboComponent<unknown>) {
    if (this.limboComponentsByReferece[modelFullReference]) {
      this.limboComponentsByReferece[modelFullReference] = this.limboComponentsByReferece[modelFullReference].filter(
        (component) => component !== componentToRemove,
      );
    }
  }

  attachLoopToArrayReference(arrayReference: string, limboLoop: LimboLoop) {
    if (!this.limboLoopsByReferece[arrayReference]) {
      this.limboLoopsByReferece[arrayReference] = [];
    }

    this.limboLoopsByReferece[arrayReference].push(limboLoop);
  }

  detachLoopFromArrayReference(arrayReference: string, limboLoop: LimboLoop) {
    if (this.limboLoopsByReferece[arrayReference]) {
      this.limboLoopsByReferece[arrayReference] = this.limboLoopsByReferece[arrayReference].filter(
        (limboLoopByReference) => limboLoopByReference !== limboLoop,
      );
    }
  }

  attachParentModelToConditions(limboModel: _LimboModel<unknown>) {
    for (const key in this.renderedConditions) {
      if (this.renderedConditions[key].parentModelReference === limboModel.getModelReference()) {
        this.renderedConditions[key].attachParentModel(limboModel);
      }
    }
  }

  attachConditionToModelReference(modelReference: string, limboCondition: LimboCondition) {
    if (!this.limboConditionsByReferece[modelReference]) {
      this.limboConditionsByReferece[modelReference] = [];
    }

    this.limboConditionsByReferece[modelReference].push(limboCondition);
  }

  detachConditionFromModelReference(modelReference: string, limboConditionToRemove: LimboCondition) {
    if (this.limboConditionsByReferece[modelReference]) {
      this.limboConditionsByReferece[modelReference] = this.limboConditionsByReferece[modelReference].filter(
        (limboConditionsByReferece) => limboConditionsByReferece !== limboConditionToRemove,
      );
    }
  }

  refreshConditions(modelReference: string, value: boolean) {
    if (typeof value === "boolean" && this.limboConditionsByReferece[modelReference]) {
      this.limboConditionsByReferece[modelReference].forEach((limboCondition) => {
        limboCondition.refresh(value);
      });
    }
  }

  attachParentModelToSwitches(limboModel: _LimboModel<unknown>) {
    for (const key in this.renderedSwitches) {
      if (this.renderedSwitches[key].parentModelReference === limboModel.getModelReference()) {
        this.renderedSwitches[key].attachParentModel(limboModel);
      }
    }
  }

  attachSwitchToModelReference(modelReference: string, limboSwitch: LimboSwitch) {
    if (!this.limboSwitchesByReferece[modelReference]) {
      this.limboSwitchesByReferece[modelReference] = [];
    }

    this.limboSwitchesByReferece[modelReference].push(limboSwitch);
  }

  detachSwitchFromModelReference(modelReference: string, limboSwitchToRemove: LimboSwitch) {
    if (this.limboSwitchesByReferece[modelReference]) {
      this.limboSwitchesByReferece[modelReference] = this.limboSwitchesByReferece[modelReference].filter(
        (limboSwitch) => limboSwitch !== limboSwitchToRemove,
      );
    }
  }

  refreshSwitches(modelReference: string, value: number | string) {
    if (this.limboSwitchesByReferece[modelReference]) {
      this.limboSwitchesByReferece[modelReference].forEach((limboSwitch) => {
        limboSwitch.refresh(value);
      });
    }
  }

  pushPendingLogic(logic: () => void) {
    this.pendingLogic.push(logic);
  }

  runPendingLogic() {
    let nextLogic = this.pendingLogic.shift();
    while (nextLogic) {
      nextLogic();
      nextLogic = this.pendingLogic.shift();
    }
  }

  clearLimboNodes(limboNodesIds: number[]) {
    for (const limboKey in this.generatedLimboNodes) {
      this.generatedLimboNodes[limboKey] = this.generatedLimboNodes[limboKey].filter((limboNode) => !limboNodesIds.includes(limboNode.id));
    }
  }
}

export default Limbo.instance;
