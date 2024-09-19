import Limbo from "./Limbo";
import { LimboModel } from "./LimboModel";

export class LimboCondition {
  private renderedConditionElement?: HTMLElement;
  private conditionInnerHtml: string = "";
  private _limboNodesIds: number[] = [];

  constructor(
    private baseConditionElement: HTMLElement,
    private baseConditionValue: boolean,
    private currentConditionValue: boolean,
    private conditionId: string,
    private parentModel: LimboModel<unknown>,
    modelReference: string,
  ) {
    this.conditionInnerHtml = this.baseConditionElement.innerHTML;
    this.baseConditionElement.innerHTML = "";
    this.parentModel.addCondition(modelReference, this);
    this.renderCondition();
  }

  get limboNodesIds(): number[] {
    return this._limboNodesIds;
  }

  async refresh(conditionValue: boolean) {
    this.currentConditionValue = conditionValue;
    this.renderCondition();
  }

  private renderCondition() {
    this.baseConditionElement.id = this.conditionId;
    this.baseConditionElement.style.display = "";

    if (this.baseConditionValue !== this.currentConditionValue) {
      if (this.renderedConditionElement) {
        this.renderedConditionElement.remove();
        delete this.renderedConditionElement;
        this.renderedConditionElement = undefined;
        Limbo.clearLimboNodes(this._limboNodesIds);
        this._limboNodesIds = [];
        Limbo.deBootstrap();
      }
    } else {
      if (!this.renderedConditionElement) {
        this.renderedConditionElement = this.baseConditionElement.cloneNode(true) as HTMLElement;
        this.renderedConditionElement.removeAttribute("data-limbo-condition");
        this.renderedConditionElement.dataset.limboConditionRendered = "true";

        this.renderedConditionElement.id = `rendered-${this.renderedConditionElement.id}`;
        this.renderedConditionElement.innerHTML = this.conditionInnerHtml;

        this._limboNodesIds = Limbo.generateLimboNodes(
          "model",
          this.conditionInnerHtml,
          this.renderedConditionElement,
          this.parentModel.getModelReference(),
        );
        this.baseConditionElement.parentElement?.insertBefore(this.renderedConditionElement, this.baseConditionElement);

        this.parentModel.bindValues();

        Limbo.bootstrap(this.renderedConditionElement, { parentComponentModel: this.parentModel });
      }
    }

    this.baseConditionElement.style.display = "none";
  }
}
