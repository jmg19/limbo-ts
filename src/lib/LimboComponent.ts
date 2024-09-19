import LimboComponentsBootstrap from "./LimboBootstrap";
import { LimboModelFactory } from "./LimboFactory";
import { LimboModel } from "./LimboModel";
import { LimboNode } from "./LimboNode";
import { generateLimboNodes } from "./utils";

export abstract class LimboComponent<T> {
  private htmlTemplate: string = "";
  private htmlContainer: HTMLElement;
  private limboNodes: { [key: string]: LimboNode[] } = {};
  private _limboModel: LimboModel<T> = LimboModelFactory.create({ model: {} }).model as LimboModel<T>;
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
    this.limboNodes = generateLimboNodes("model", html, this.htmlContainer);
    this.renderComponent(model).then(() => this.OnComponentLoaded());
  }

  protected get limboModel(): LimboModel<T> {
    return this._limboModel;
  }

  protected set limboModel(_: LimboModel<T>) {
    throw new Error("Cannot set limboModel. Use setModel method instead.");
  }

  protected setModel(model: T) {
    this.renderComponent(model);
  }

  private async renderComponent(model?: T) {
    const creationResponse = LimboModelFactory.create({ model, LimboNodes: this.limboNodes });
    this._limboModel = creationResponse.model as LimboModel<T>;
    if (creationResponse.toBuild) {
      this._limboModel.buildValues();
    }

    this._limboModel.bindValues();

    if (this.componentElement) {
      this.htmlContainer.childNodes.forEach((node) => this.componentElement?.appendChild(node));
      LimboComponentsBootstrap(this.componentElement, { parentComponentModel: this._limboModel });
    } else {
      console.error(`Element with id ${this.componentId} not found`);
    }
  }

  protected abstract OnComponentLoaded(): void;
}
