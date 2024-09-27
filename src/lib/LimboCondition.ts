import Limbo from "./Limbo";
import { _LimboModel, LimboModel } from "./LimboModel";

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
    private modelReference: string,
  ) {
    this.conditionInnerHtml = this.baseConditionElement.innerHTML;
    this.baseConditionElement.innerHTML = "";
    this.renderCondition();
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
    Limbo.detachConditionFromModelReference(this.modelReference, this);
  }

  refresh(conditionValue: boolean) {
    this.currentConditionValue = conditionValue;
    this.renderCondition();
  }

  private renderCondition() {
    this.baseConditionElement.id = this.conditionId;

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
        this.renderedConditionElement.style.display = "";
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
  }
}
