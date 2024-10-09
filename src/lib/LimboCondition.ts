import Limbo, { LimboMountableElement } from "./Limbo";
import { LimboComponent } from "./LimboComponent";
import { _LimboModel, LimboModel } from "./LimboModel";

export class LimboCondition implements LimboMountableElement {
  private renderedConditionElement?: HTMLElement;
  private conditionInnerHtml: string = "";
  private _limboNodesIds: number[] = [];
  private mountedChilds: LimboMountableElement[] = [];

  constructor(
    private baseConditionElement: HTMLElement,
    private baseConditionValue: boolean | string | number | undefined | null,
    private currentConditionValue: boolean | string | number | undefined | unknown | null,
    private isNotCondition: boolean,
    private conditionId: string,
    private parentModel: LimboModel<unknown>,
    private parentComponent: LimboComponent<unknown>,
    private modelReference: string,
  ) {
    this.conditionInnerHtml = this.baseConditionElement.innerHTML;
    this.baseConditionElement.innerHTML = "";
  }

  mount(): void {
    this.renderCondition();
  }

  unmount(): void {
    this.unmountChilds();
    this.renderedConditionElement?.remove();
    this.baseConditionElement.remove();
    Limbo.clearLimboNodes(this._limboNodesIds);
    Limbo.detachConditionFromModelReference(this.modelReference, this);
    Limbo.removeRenderedCondition(this.conditionId);
  }

  private mountChilds(): void {
    if (this.renderedConditionElement) {
      this.mountedChilds = Limbo.bootstrap(this.renderedConditionElement, {
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

  get limboNodesIds(): number[] {
    return this._limboNodesIds;
  }

  get parentModelReference(): string {
    return this.parentModel.getModelReference();
  }

  attachParentModel(limboModel: _LimboModel<unknown>) {
    this.parentModel = limboModel;
  }

  refresh(conditionValue: boolean | string | number | undefined | unknown | null) {
    this.currentConditionValue = conditionValue;
    this.renderCondition();
  }

  private renderCondition() {
    this.baseConditionElement.id = this.conditionId;

    if (
      (!this.isNotCondition && this.baseConditionValue !== this.currentConditionValue) ||
      (this.isNotCondition && this.baseConditionValue === this.currentConditionValue)
    ) {
      if (this.renderedConditionElement) {
        this.unmountChilds();
        this.renderedConditionElement.remove();
        delete this.renderedConditionElement;
        this.renderedConditionElement = undefined;
        Limbo.clearLimboNodes(this._limboNodesIds);
        this._limboNodesIds = [];
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

        this.mountChilds();

        this.parentComponent.bindEvents();
        this.parentComponent.bindLimboRoutingLinks();
      }
    }
  }
}
