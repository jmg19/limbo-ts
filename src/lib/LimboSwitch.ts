import Limbo from "./Limbo";
import { _LimboModel, LimboModel } from "./LimboModel";

export class LimboSwitch {
  private renderedSwitchElement?: HTMLElement;
  private switchInnerHtml: { [key: string | number]: string } = {};
  private _limboNodesIds: number[] = [];
  private baseSwitchValues: (string | number)[] = [];
  private currentSwitchValue?: number | string;

  constructor(
    private baseSwitchElement: HTMLElement,
    private switchId: string,
    private parentModel: LimboModel<unknown>,
    private modelReference: string,
  ) {
    this.extractInnerHtmlOptions(this.baseSwitchElement.innerHTML);
    this.baseSwitchElement.innerHTML = "";
    this.currentSwitchValue = this.parentModel.getByModelReference(this.modelReference) as number | string;
    this.renderSwitch();
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

  detachFromModel() {
    Limbo.detachSwitchFromModelReference(this.modelReference, this);
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

      this.renderSwitch();
    }
  }

  private renderSwitch() {
    this.baseSwitchElement.id = this.switchId;

    this.deBootstrapOldOption();

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

    Limbo.bootstrap(this.renderedSwitchElement, { parentComponentModel: this.parentModel });
  }

  private deBootstrapOldOption() {
    if (this.renderedSwitchElement) {
      this.renderedSwitchElement.remove();
      delete this.renderedSwitchElement;
      this.renderedSwitchElement = undefined;
      Limbo.clearLimboNodes(this._limboNodesIds);
      this._limboNodesIds = [];
      Limbo.deBootstrap();
    }
  }
}