import "./Limbo.css";
import { LimboArray } from "./LimboArray";
import { LimboComponent } from "./LimboComponent";
import { LimboCondition } from "./LimboCondition";
import { LimboLoop } from "./LimboLoop";
import { _LimboModel, LimboModel } from "./LimboModel";
import { LimboNode } from "./LimboNode";
import { LimboRoute, LimboRouting, LimboRoutingGroup } from "./LimboRouting";
import { LimboSwitch } from "./LimboSwitch";

export interface LimboMountableElement {
  mount(): void;
  unmount(): void;
}

export type LimboBootstrapOptions = {
  components?: { [key: string]: Type<LimboComponent<unknown>> };
  limboRoutes?: { routingName: string; routes: { path: string; component: Type<LimboComponent<unknown>> }[] }[];
  parentComponent?: LimboComponent<unknown>;
  parentComponentModel?: LimboModel<unknown>;
  loopItemModel?: LimboModel<unknown>;
  modelPrefix?: string;
  routingParams?: unknown;
  firstLoad?: boolean;
};

class Limbo {
  static #instance: Limbo;

  private aplicationComponents: { [key: string]: Type<LimboComponent<unknown>> } = {};
  private limboRoutes: LimboRoutingGroup[] = [];
  private renderedComponents: { [key: string]: LimboComponent<unknown> } = {};
  private renderedLoops: { [key: string]: LimboLoop } = {};
  private renderedConditions: { [key: string]: LimboCondition } = {};
  private renderedSwitches: { [key: string]: LimboSwitch } = {};
  private renderedRoutings: { [key: string]: LimboRouting } = {};
  private limboConditionsByReferece: { [key: string]: LimboCondition[] } = {};
  private limboSwitchesByReferece: { [key: string]: LimboSwitch[] } = {};
  private limboLoopsByReferece: { [key: string]: LimboLoop[] } = {};
  private limboComponentsByReferece: { [key: string]: LimboComponent<unknown>[] } = {};
  private generatedLimboNodes: { [key: string]: LimboNode[] } = {};
  private pendingLogic: (() => void)[] = [];
  private routingsRenderedAfterHistoryPopState: { [key: string]: boolean } = {};

  private constructor() {}

  public static get instance(): Limbo {
    if (!Limbo.#instance) {
      Limbo.#instance = new Limbo();
    }

    return Limbo.#instance;
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
      parentElement.getAttribute("data-limbo-switch-rendered") ||
      parentElement.getAttribute("data-limbo-routing")
    );
  }

  private bootstrapLimboLoops(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string): LimboMountableElement[] {
    const loopElements = element.querySelectorAll("[data-limbo-loop]");
    const loopsToRender: Element[] = this.filterElementsTorender(loopElements, element);
    const mountableElements: LimboMountableElement[] = [];

    loopsToRender.forEach((loopToRender) => {
      const loopModelReference = loopToRender.getAttribute("data-limbo-loop");
      const loopId = loopToRender.id || `loop-${new Date().getTime().toString()}`;

      if (!options.parentComponentModel) {
        console.error("Parent Component Model must exist.");
        return;
      }

      if (!loopModelReference) {
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
      const matches = [...loopModelReference.matchAll(regex)];

      if (matches.length === 0 || matches[0].length !== 3) {
        console.error("data-limbo-loop value must be in the format {{itemName of modelReference}}");
        return;
      }

      if (!options.parentComponent) {
        console.error("Parent Component must exist.");
        return;
      }

      const itemName = matches[0][1];
      const modelReference = matches[0][2];
      const modelFullReference = modelReference.replace(`${modelPrefix}`, options.parentComponentModel.getModelReference());

      const modelReferenceValue = options.parentComponentModel.getByModelReference(modelReference);

      if (modelReferenceValue && !(modelReferenceValue instanceof LimboArray)) {
        console.error("modelReference", "Value must be an instance of LimboArray");
        return;
      }

      this.renderedLoops[loopId] = new LimboLoop(
        loopId,
        loopToRender as HTMLElement,
        itemName,
        options.parentComponent,
        modelReferenceValue as LimboArray<unknown>,
      );
      this.renderedLoops[loopId].mount();
      this.attachLoopToArrayReference(modelFullReference, this.renderedLoops[loopId]);

      mountableElements.push(this.renderedLoops[loopId]);
    });

    return mountableElements;
  }

  private bootstrapLimboRoutings(element: HTMLElement): LimboMountableElement[] {
    const limboRoutingElements = element.querySelectorAll("[data-limbo-routing]");
    const routingsToRender: Element[] = this.filterElementsTorender(limboRoutingElements, element);
    const mountableElements: LimboMountableElement[] = [];

    routingsToRender.forEach((routingElement) => {
      const routingName = routingElement.getAttribute("data-limbo-routing");
      routingElement.id = routingElement.id || `routing-${new Date().getTime().toString()}`;

      if (!routingName) {
        throw new Error(" data-limbo-routing value should not be empty.");
      }

      const routeGroup = this.limboRoutes.find((routeGroup) => routeGroup.routingName === routingName);
      if (!routeGroup) {
        throw new Error(`Routing with name ${routingName} not found`);
      }

      if (this.renderedRoutings[routingName]) {
        console.error(`Routing with routing name ${routingName} already rendered`);
        return;
      }

      this.renderedRoutings[routingName] = new LimboRouting(routingName, routingElement as HTMLElement, routeGroup.routes);
      this.renderedRoutings[routingName].mount();
      mountableElements.push(this.renderedRoutings[routingName]);
    });

    return mountableElements;
  }

  private bootstrapLimboComponents(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string): LimboMountableElement[] {
    const limboComponentElements = element.querySelectorAll("[data-limbo-component]");
    const componentsToRender: Element[] = this.filterElementsTorender(limboComponentElements, element);
    const mountableElements: LimboMountableElement[] = [];

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

        if (modelFullReference) {
          if (options.parentComponentModel) {
            model = options.parentComponentModel.getByModelReference(modelFullReference);

            modelFullReference = modelFullReference.replace("{{", "").replace("}}", "");
            modelFullReference = modelFullReference.replace(`${modelPrefix}`, options.parentComponentModel.getModelReference());
          }

          if (options.loopItemModel) {
            model = options.loopItemModel.getByModelReference(modelFullReference);
            modelFullReference = options.loopItemModel.getModelReference();
          }
        }

        const component = new this.aplicationComponents[componentName](componentId, {
          model,
          modelReference: modelFullReference,
          routingParams: options.routingParams,
        }) as LimboComponent<unknown>;
        this.renderedComponents[componentId] = component;
        component.mount();

        if (modelFullReference) {
          this.attachComponentToModelReference(modelFullReference, component);
        }

        mountableElements.push(component);
      } else {
        console.error(`Implementation for Component ${componentName} was not found!`);
      }
    });

    return mountableElements;
  }

  private bootstrapLimboSwitches(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string): LimboMountableElement[] {
    const switchElements = element.querySelectorAll("[data-limbo-switch]");
    const switchesToRender: Element[] = this.filterElementsTorender(switchElements, element);
    const mountableElements: LimboMountableElement[] = [];

    switchesToRender.forEach((switchElement) => {
      const switchModelReference = switchElement.getAttribute("data-limbo-switch");
      const switchId = switchElement.id || `switch-${new Date().getTime().toString()}`;

      if (!options.parentComponentModel) {
        console.error("Parent Component Model must exist.");
        return;
      }

      if (!switchModelReference) {
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
      const matches = [...switchModelReference.matchAll(regex)];

      if (matches.length === 0 || matches[0].length !== 2) {
        console.error("data-limbo-switch value must be in the format {{modelReference}}");
        return;
      }

      if (!options.parentComponent) {
        console.error("Parent Component must exist.");
        return;
      }

      const modelReference = matches[0][1];
      const modelFullReference = modelReference.replace(`${modelPrefix}`, options.parentComponentModel.getModelReference());

      this.renderedSwitches[switchId] = new LimboSwitch(
        switchElement as HTMLElement,
        switchId,
        options.parentComponentModel,
        options.parentComponent,
        modelFullReference,
      );
      this.renderedSwitches[switchId].mount();
      this.attachSwitchToModelReference(modelFullReference, this.renderedSwitches[switchId]);
      mountableElements.push(this.renderedSwitches[switchId]);
    });

    return mountableElements;
  }

  private bootstrapLimboConditions(element: HTMLElement, options: LimboBootstrapOptions, modelPrefix: string): LimboMountableElement[] {
    const conditionsElements = element.querySelectorAll("[data-limbo-condition]");
    const conditionsToRender: Element[] = this.filterElementsTorender(conditionsElements, element);
    const mountableElements: LimboMountableElement[] = [];

    conditionsToRender.forEach((conditionToRender) => {
      const conditionModelReference = conditionToRender.getAttribute("data-limbo-condition");
      const conditionId = conditionToRender.id || `condition-${new Date().getTime().toString()}`;

      if (!options.parentComponentModel) {
        console.error("Parent Component Model must exist.");
        return;
      }

      if (!conditionModelReference) {
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

      const regex = new RegExp(`{{(${modelPrefix}\\..+) (is|is not) (true|false|'[^']*'|[+-]?[0-9]*[.]?[0-9]+|undefined|null)}}`, "g");
      const matches = [...conditionModelReference.matchAll(regex)];

      if (matches.length === 0 || matches[0].length !== 4) {
        console.error("data-limbo-condition value must be in the format {{modelReference is boolean|string|number|undefined|null}}");
        return;
      }

      if (!options.parentComponent) {
        console.error("Parent Component must exist.");
        return;
      }

      const modelReference = matches[0][1];
      let conditionalValue;
      if (matches[0][3] === "true") {
        conditionalValue = true;
      } else if (matches[0][3] === "false") {
        conditionalValue = false;
      } else if (matches[0][3] === "undefined") {
        conditionalValue = undefined;
      } else if (matches[0][3] === "null") {
        conditionalValue = null;
      } else if (matches[0][3].startsWith("'") && matches[0][3].endsWith("'")) {
        conditionalValue = matches[0][3].replace(/'/g, "");
      } else if (!isNaN(parseFloat(matches[0][3]))) {
        conditionalValue = parseFloat(matches[0][3]);
      }

      const modelReferenceValue = options.parentComponentModel.getByModelReference(modelReference);
      const modelFullReference = modelReference.replace(`${modelPrefix}`, options.parentComponentModel.getModelReference());

      this.renderedConditions[conditionId] = new LimboCondition(
        conditionToRender as HTMLElement,
        conditionalValue,
        modelReferenceValue,
        matches[0][2] === "is not",
        conditionId,
        options.parentComponentModel,
        options.parentComponent,
        modelFullReference,
      );
      this.attachConditionToModelReference(modelFullReference, this.renderedConditions[conditionId]);
      this.renderedConditions[conditionId].mount();
      mountableElements.push(this.renderedConditions[conditionId]);
    });

    return mountableElements;
  }

  public bootstrap(element: HTMLElement, options: LimboBootstrapOptions = {}): LimboMountableElement[] {
    const modelPrefix = options.modelPrefix || "model";

    if (options.components) {
      this.aplicationComponents = options.components;
    }

    if (options.limboRoutes) {
      this.limboRoutes = this.parseRoutes(options.limboRoutes);
      for (const routeGroup of this.limboRoutes) {
        this.routingsRenderedAfterHistoryPopState[routeGroup.routingName] = false;
      }
    }

    const mountableElements: LimboMountableElement[] = [];

    mountableElements.push(...this.bootstrapLimboSwitches(element, options, modelPrefix));

    mountableElements.push(...this.bootstrapLimboConditions(element, options, modelPrefix));

    mountableElements.push(...this.bootstrapLimboLoops(element, options, modelPrefix));

    mountableElements.push(...this.bootstrapLimboComponents(element, options, modelPrefix));

    mountableElements.push(...this.bootstrapLimboRoutings(element));

    if (options.firstLoad) {
      this.replaceHistoryState();
    }

    return mountableElements;
  }

  private replaceHistoryState() {
    setTimeout(() => {
      const renderedComponentsModelData: { [key: string]: unknown } = {};
      for (const key in this.renderedComponents) {
        renderedComponentsModelData[key] = this.renderedComponents[key].getLimboModelData();
      }

      history.replaceState({ renderedComponentsModelData }, "", window.location.pathname);
    }, 250);
  }

  private parseRoutes(
    limboRoutes: { routingName: string; routes: { path: string; component: Type<LimboComponent<unknown>> }[] }[],
  ): LimboRoutingGroup[] {
    const parsedGroups: LimboRoutingGroup[] = [];
    const pathRegex = new RegExp(`(\\/[^\\/]+)`, "g");

    limboRoutes.forEach((routeGroup) => {
      const parsedRoutes: LimboRoute[] = [];

      routeGroup.routes.forEach((route) => {
        if (route.path === "/") {
          parsedRoutes.push({
            component: route.component,
            path: ["/"],
          });
        } else {
          const matches = route.path.match(pathRegex);
          if (matches && matches.length > 0) {
            parsedRoutes.push({
              component: route.component,
              path: matches.map((match) => match),
            });
          }
        }
      });

      if (parsedRoutes.length > 0) {
        parsedGroups.push({
          routingName: routeGroup.routingName,
          routes: parsedRoutes,
        });
      }
    });

    return parsedGroups;
  }

  private shouldGenerateLimboNode(node: Node, htmlContainer: HTMLElement): boolean {
    let parentElement = node.parentElement;
    while (parentElement && parentElement !== htmlContainer) {
      if (this.isLimboElement(parentElement)) {
        return false;
      }
      parentElement = parentElement.parentElement;
    }

    return true;
  }

  generateLimboNodes(modelName: string, html: string, htmlContainer: HTMLElement, rootReference: string, modelPrefix?: string): number[] {
    const limboNodesIds: number[] = [];
    const regex = new RegExp(`([a-zA-z-]+)=("[^"]*({{${modelName}\\.[^"]+}})[^"]*")|(("({{${modelName}}}))[^"]*")`, "g");
    const regexIt = html.matchAll(regex);

    for (const match of regexIt) {
      const attributeName = match[1];
      const modelReference = match[3];
      const limboKey = modelReference.replace(modelPrefix || "model", rootReference);

      const selectorString = `[${attributeName}*="${modelReference}"]`;
      const node = htmlContainer.querySelector(selectorString) as HTMLElement;

      if (node && this.shouldGenerateLimboNode(node, htmlContainer)) {
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
      if (!this.shouldGenerateLimboNode(node, htmlContainer)) {
        return NodeFilter.FILTER_SKIP;
      }

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
      attributeName !== "data-limbo-switch-rendered" &&
      attributeName !== "data-limbo-event" &&
      attributeName !== "data-limbo-routing"
    );
  }

  private filterElementsTorender(elements: NodeListOf<Element>, element: HTMLElement): Element[] {
    const elementsToRender: Element[] = [];

    elements.forEach((elem) => {
      let shouldRender = true;
      let parentElement = elem.parentElement;
      while (parentElement && parentElement !== element) {
        if (this.isLimboElement(parentElement)) {
          shouldRender = false;
          break;
        }
        parentElement = parentElement.parentElement;
      }

      if (shouldRender) {
        elementsToRender.push(elem);
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

  detachComponentFromModelReference(modelFullReference: string, componentToRemove: LimboComponent<unknown>) {
    if (this.limboComponentsByReferece[modelFullReference]) {
      this.limboComponentsByReferece[modelFullReference] = this.limboComponentsByReferece[modelFullReference].filter(
        (component) => component !== componentToRemove,
      );
    }
  }

  removeRenderedComponent(componentId: string) {
    delete this.renderedComponents[componentId];
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

  removeRenderedLoop(loopId: string) {
    delete this.renderedLoops[loopId];
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

  removeRenderedCondition(conditionId: string) {
    delete this.renderedConditions[conditionId];
  }

  refreshConditions(modelReference: string, value: boolean | string | number | undefined | unknown | null) {
    if (this.limboConditionsByReferece[modelReference]) {
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

  removeRenderedSwitch(switchId: string) {
    delete this.renderedSwitches[switchId];
  }

  refreshSwitches(modelReference: string, value: number | string) {
    if (this.limboSwitchesByReferece[modelReference]) {
      this.limboSwitchesByReferece[modelReference].forEach((limboSwitch) => {
        limboSwitch.refresh(value);
      });
    }
  }

  removeRenderedRouting(routingName: string) {
    delete this.renderedRoutings[routingName];
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

  navigate(path: string) {
    const renderedComponentsModelData: { [key: string]: unknown } = {};
    for (const key in this.renderedComponents) {
      renderedComponentsModelData[key] = this.renderedComponents[key].getLimboModelData();
    }

    this.limboRoutes.forEach((routeGroup) => {
      if (this.renderedRoutings[routeGroup.routingName]) {
        this.renderedRoutings[routeGroup.routingName].navigate(path);
      }
    });

    history.pushState(renderedComponentsModelData, "", path);
  }

  setComponentsModelsDataOnHistoryPopState(routingName: string) {
    if (!history.state || this.routingsRenderedAfterHistoryPopState[routingName]) {
      return;
    }

    this.routingsRenderedAfterHistoryPopState[routingName] = true;

    for (const key in this.routingsRenderedAfterHistoryPopState) {
      if (!this.routingsRenderedAfterHistoryPopState[key]) {
        return;
      }
    }

    for (const key in history.state) {
      if (this.renderedComponents[key]) {
        this.renderedComponents[key].setLimboModelData(history.state[key]);
      }
    }

    for (const key in this.routingsRenderedAfterHistoryPopState) {
      this.routingsRenderedAfterHistoryPopState[key] = false;
    }
  }
}

export declare const Type: FunctionConstructor;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export declare interface Type<T> extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
}

export default Limbo.instance;
