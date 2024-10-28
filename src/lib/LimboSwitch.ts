import Limbo, { LimboMountableElement } from "./Limbo";
import { LimboComponent } from "./LimboComponent";
import { _LimboModel, LimboModel } from "./LimboModel";

export class LimboSwitch implements LimboMountableElement {
  private renderedSwitchElement?: HTMLElement;
  private switchInnerHtml: { [key: string | number]: string } = {};
  private _limboNodesIds: number[] = [];
  private baseSwitchValues: (string | number)[] = [];
  private currentSwitchValue?: number | string;
  private mountedChilds: LimboMountableElement[] = [];

  constructor(
    private baseSwitchElement: HTMLElement,
    private switchId: string,
    private parentModel: LimboModel<unknown>,
    private parentComponent: LimboComponent<unknown>,
    private modelReference: string,
  ) {
    this.extractInnerHtmlOptions(this.baseSwitchElement.innerHTML);
    this.baseSwitchElement.innerHTML = "";
    this.currentSwitchValue = this.parentModel.getByModelReference(this.modelReference) as number | string;
  }

  private mountChilds(): void {
    if (this.renderedSwitchElement) {
      this.mountedChilds = Limbo.bootstrap(this.renderedSwitchElement, {
        parentComponentModel: this.parentModel,
        parentComponent: this.parentComponent,
      });
    }
  }

  private unmountChilds(): void {
    while (this.mountedChilds.length > 0) {
      this.mountedChilds.pop()?.unmount();
    }
  }

  private extractInnerHtmlOptions(innerHTML: string) {
    const auxElement = document.createElement("div");
    auxElement.innerHTML = innerHTML;
    const options = auxElement.querySelectorAll("[data-limbo-switch-case]");
    const defaultOption = auxElement.querySelector("[data-limbo-switch-default]");

    this.switchInnerHtml.default = "";
    if (defaultOption) {
      defaultOption.removeAttribute("data-limbo-switch-default");
      this.switchInnerHtml.default = defaultOption.outerHTML;
    }

    options.forEach((option) => {
      const value = option.getAttribute("data-limbo-switch-case");
      if (!value) {
        throw new Error("LimboSwitch: data-limbo-switch-case requires a value");
      }
      option.removeAttribute("data-limbo-switch-case");
      this.switchInnerHtml[value] = option.outerHTML;
      this.baseSwitchValues.push(value);
    });
  }

  get limboNodesIds(): number[] {
    return this._limboNodesIds;
  }

  get parentModelReference(): string {
    return this.parentModel.getModelReference();
  }

  attachParentModel(limboModel: _LimboModel<unknown>) {
    this.parentModel = limboModel;
  }

  refresh(value: number | string) {
    if (value !== this.currentSwitchValue) {
      if (this.baseSwitchValues.includes(value)) {
        this.currentSwitchValue = value;
      } else {
        if (this.currentSwitchValue === undefined) {
          return;
        }
        this.currentSwitchValue = undefined;
      }

      this.mount();
    }
  }

  unmount(): void {
    this.unmountChilds();
    this.renderedSwitchElement?.remove();
    this.baseSwitchElement.remove();
    Limbo.clearLimboNodes(this._limboNodesIds);
    Limbo.detachSwitchFromModelReference(this.modelReference, this);
    Limbo.removeRenderedSwitch(this.switchId);
  }

  mount() {
    this.baseSwitchElement.id = this.switchId;

    this.unmountOldOption();

    this.renderedSwitchElement = this.baseSwitchElement.cloneNode(true) as HTMLElement;
    this.renderedSwitchElement.style.display = "";

    this.renderedSwitchElement.removeAttribute("data-limbo-switch");
    this.renderedSwitchElement.dataset.limboSwitchRendered = "true";

    this.renderedSwitchElement.id = `rendered-${this.renderedSwitchElement.id}`;
    this.renderedSwitchElement.innerHTML = this.switchInnerHtml[this.currentSwitchValue || "default"]; // This should the innetHtml that matches the switch value

    this._limboNodesIds = Limbo.generateLimboNodes(
      "model",
      this.switchInnerHtml[this.currentSwitchValue || "default"], // This should the innetHtml that matches the switch value
      this.renderedSwitchElement,
      this.parentModel.getModelReference(),
    );
    this.baseSwitchElement.parentElement?.insertBefore(this.renderedSwitchElement, this.baseSwitchElement);

    this.parentModel.bindValues();

    this.mountChilds();

    this.parentComponent.bindEvents();
    this.parentComponent.bindLimboRoutingLinks();
  }

  private unmountOldOption() {
    if (this.renderedSwitchElement) {
      this.unmountChilds();
      this.renderedSwitchElement.remove();
      delete this.renderedSwitchElement;
      this.renderedSwitchElement = undefined;
      Limbo.clearLimboNodes(this._limboNodesIds);
      this._limboNodesIds = [];
    }
  }
}
