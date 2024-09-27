import Limbo from "./Limbo";
import { LimboModelFactory } from "./LimboFactory";
import { LimboModel } from "./LimboModel";

export type LimboComponentOptions<T> = {
  model?: T;
  alias?: string;
};

export abstract class LimboComponent<T> {
  private htmlTemplate: string = "";
  private htmlContainer: HTMLElement;
  private _limboModel: LimboModel<T>;
  private _limboNodesIds: number[] = [];
  protected componentElement: HTMLElement | null = null;

  constructor(
    protected componentId: string,
    html: string,
    options: LimboComponentOptions<T> = {},
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

    this.generateLimboNodes();
    this.renderComponent().then(() => this.OnComponentLoaded());
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

  protected setModel(model: T) {
    this.buildModel(model);
    this._limboModel.bindValues();
  }

  private buildModel(model: T | undefined) {
    const creationResponse = LimboModelFactory.create({
      model,
    });
    this._limboModel = creationResponse.model as LimboModel<T>;
    if (creationResponse.toBuild) {
      this._limboModel.buildValues();
      Limbo.attachModelToComponents(this._limboModel);
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
      this.bootstrap();
    } else {
      console.error(`Element with id ${this.componentId} not found`);
    }
  }

  private bootstrap() {
    if (!this.componentElement) {
      return;
    }

    Limbo.bootstrap(this.componentElement, { parentComponentModel: this._limboModel });
  }

  protected abstract OnComponentLoaded(): void;
}
