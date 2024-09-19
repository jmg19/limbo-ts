import Limbo from "./Limbo";
import { LimboModelFactory } from "./LimboFactory";
import { LimboModel } from "./LimboModel";

export abstract class LimboComponent<T> {
  private htmlTemplate: string = "";
  private htmlContainer: HTMLElement;
  private _limboModel: LimboModel<T> = LimboModelFactory.create({ model: {} }).model as LimboModel<T>;
  private _limboNodesIds: number[] = [];
  protected componentElement: HTMLElement | null = null;

  constructor(
    protected componentId: string,
    html: string,
    model?: T,
  ) {
    this.componentElement = document.getElementById(this.componentId);
    this.htmlContainer = document.createElement("div");
    this.htmlTemplate = html;
    this.htmlContainer.innerHTML = this.htmlTemplate;
    this.buildModel(model);
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

  protected setModel(model: T) {
    this.buildModel(model);
    this._limboModel.bindValues();
    this.bootstrap();
  }

  private buildModel(model: T | undefined) {
    const creationResponse = LimboModelFactory.create({ model });
    this._limboModel = creationResponse.model as LimboModel<T>;
    if (creationResponse.toBuild) {
      this._limboModel.buildValues();
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
