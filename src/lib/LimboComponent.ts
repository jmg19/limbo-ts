import Limbo, { LimboMountableElement } from "./Limbo";
import { LimboModelFactory } from "./LimboFactory";
import { LimboModel } from "./LimboModel";

export type LimboComponentOptions<T, RoutingParams = void> = {
  model?: T;
  modelReference?: string;
  routingParams?: RoutingParams;
};

export abstract class LimboComponent<T, RoutingParams = void> implements LimboMountableElement {
  setLimboModelData(data: T) {
    this.setModelData(data);
  }

  private htmlTemplate: string = "";
  private htmlContainer: HTMLElement;
  private _limboModel: LimboModel<T>;
  private _limboNodesIds: number[] = [];
  protected componentElement: HTMLElement | null = null;
  private mountedChilds: LimboMountableElement[] = [];
  private bindedEvents: { element: Element; eventName: string; navigate: boolean; event: EventListener }[] = [];

  constructor(
    protected componentId: string,
    html: string,
    options: LimboComponentOptions<T, RoutingParams> = {},
  ) {
    this.componentElement = document.getElementById(this.componentId);
    this.htmlContainer = document.createElement("div");
    this.htmlTemplate = html;
    this.htmlContainer.innerHTML = this.htmlTemplate;

    const modelCreateResponse = LimboModelFactory.create(options);
    this._limboModel = modelCreateResponse.model;
    if (modelCreateResponse.toBuild) {
      this._limboModel.buildValues();
    }
  }

  unmount(): void {
    this.onUnmount();
    this.unmountChilds();
    if (this.componentElement) {
      this.componentElement.remove();
    }

    Limbo.clearLimboNodes(this._limboNodesIds);
    Limbo.detachComponentFromModelReference(this._limboModel.getModelReference(), this);
    Limbo.removeRenderedComponent(this.componentId);

    this.bindedEvents.forEach((bindedEvent) => {
      bindedEvent.element.removeEventListener(bindedEvent.eventName, bindedEvent.event);
    });
  }

  private mountChilds(): void {
    if (!this.componentElement) {
      return;
    }

    this.mountedChilds = Limbo.bootstrap(this.componentElement, { parentComponentModel: this._limboModel, parentComponent: this });
  }

  private unmountChilds(): void {
    while (this.mountedChilds.length > 0) {
      this.mountedChilds.pop()?.unmount();
    }
  }

  mount() {
    this.generateLimboNodes();
    this.renderComponent().then(() => {
      this.bindEvents();
      this.bindLimboRoutingLinks();
      this.onMount();
    });
  }

  get limboNodesIds(): number[] {
    return this._limboNodesIds;
  }

  protected get limboModel(): LimboModel<T> {
    return this._limboModel;
  }

  protected set limboModel(_: LimboModel<T>) {
    throw new Error("Cannot set limboModel. Use setModel method instead.");
  }

  attachModel(limboModel: LimboModel<T>) {
    this._limboModel = limboModel;
  }

  public setModelData(model: T) {
    this.buildModel(model);
    this._limboModel.bindValues();
  }

  private buildModel(model: T | undefined) {
    const creationResponse = LimboModelFactory.create({
      model,
      modelReference: this._limboModel.getModelReference(),
    });
    this._limboModel = creationResponse.model as LimboModel<T>;
    if (creationResponse.toBuild) {
      this._limboModel.buildValues();
      Limbo.attachParentModelToConditions(this._limboModel);
      Limbo.attachParentModelToSwitches(this._limboModel);
    }
  }

  private generateLimboNodes() {
    this._limboNodesIds = Limbo.generateLimboNodes("model", this.htmlTemplate, this.htmlContainer, this._limboModel.getModelReference());
  }

  private async renderComponent() {
    this._limboModel.bindValues();

    if (this.componentElement) {
      this.htmlContainer.childNodes.forEach((node) => this.componentElement?.appendChild(node));
      this.mountChilds();
    } else {
      console.error(`Element with id ${this.componentId} not found`);
    }
  }

  private filterElementsToBindEvents(elements: NodeListOf<Element>, element: HTMLElement): Element[] {
    const elementsToBindEvents: Element[] = [];

    elements.forEach((switchElement) => {
      let shouldBind = true;
      let parentElement = switchElement.parentElement;
      while (parentElement && parentElement !== element) {
        if (parentElement.getAttribute("data-limbo-component")) {
          shouldBind = false;
          break;
        }
        parentElement = parentElement.parentElement;
      }

      if (shouldBind) {
        elementsToBindEvents.push(switchElement);
      }
    });

    return elementsToBindEvents;
  }

  parseParams(params: string[]): (number | string | boolean | unknown)[] {
    return params.map((param) => {
      const valueFromModelByRef = this._limboModel.getByModelReference(param);

      if (valueFromModelByRef) {
        return valueFromModelByRef;
      }

      if (param === "true") {
        return true;
      } else if (param === "false") {
        return false;
      } else if (!isNaN(Number(param))) {
        return Number(param);
      } else {
        return param;
      }
    });
  }

  getLimboModelData(): T {
    return this._limboModel.toObject();
  }

  bindEvents() {
    if (this.componentElement) {
      const eventElements = this.componentElement?.querySelectorAll("[data-limbo-event]");
      const elementsToBind = this.filterElementsToBindEvents(eventElements, this.componentElement);

      elementsToBind?.forEach((element) => {
        const events = (element.getAttribute("data-limbo-event") || "").split(";");
        events.forEach((event) => {
          const eventSplit = event.split(":");
          if (eventSplit.length < 2) {
            throw new Error("LimboComponent: data-limbo-event requires a value in the format 'event:method:param1:...:paramN'");
          }

          const eventName = eventSplit[0];
          const alreadyBindedElement = this.bindedEvents.find(
            (bindedEvent) => bindedEvent.element === element && bindedEvent.eventName === eventName && !bindedEvent.navigate,
          );

          if (!alreadyBindedElement) {
            const params = eventSplit.slice(2);

            const methodName = eventSplit[1];
            const functionExists = !!this[methodName as keyof this];
            if (functionExists) {
              const bindedEvent = {
                element,
                eventName,
                navigate: false,
                event: (e: Event) => {
                  const parsedParams = this.parseParams(params);
                  (this[methodName as keyof this] as (e: Event, ...params: (number | string | boolean | unknown)[]) => void)(
                    e,
                    ...parsedParams,
                  );
                },
              };
              element.addEventListener(eventName, bindedEvent.event);
              this.bindedEvents.push(bindedEvent);
            } else {
              console.error(`Method ${methodName} not implemented in component ${this.componentId}`);
            }
          }
        });
      });
    }
  }

  bindLimboRoutingLinks() {
    if (this.componentElement) {
      const routingLinks = this.componentElement?.querySelectorAll("[data-limbo-href]");
      const elementsToBind = this.filterElementsToBindEvents(routingLinks, this.componentElement);

      elementsToBind?.forEach((element) => {
        const alreadyBindedElement = this.bindedEvents.find(
          (bindedEvent) => bindedEvent.element === element && bindedEvent.eventName === "click" && bindedEvent.navigate,
        );

        if (!alreadyBindedElement) {
          const routePath = element.getAttribute("data-limbo-href") || "/";

          const bindedEvent = {
            element,
            eventName: "click",
            navigate: true,
            event: (e: Event) => {
              e.preventDefault();

              Limbo.navigate(routePath);
            },
          };

          element.addEventListener("click", bindedEvent.event);
          this.bindedEvents.push(bindedEvent);
        }
      });
    }
  }

  protected abstract onMount(): void;
  protected abstract onUnmount(): void;
}
