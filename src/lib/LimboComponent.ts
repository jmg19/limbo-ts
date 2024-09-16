import LimboComponentsBootstrap from "./LimboBootstrap";
import { LimboModel, LimboModelFactory } from "./LimboModel";
import { LimboNode } from "./LimboNode";
import { ModelBinderNode } from "./ModelBinderNode";
import { ModelBuilderNode } from "./ModelBuilderNode";
import { generateLimboNodes } from "./utils";

export abstract class LimboComponent<T> {
  private htmlTemplate: string = "";
  private htmlContainer: HTMLElement;
  private limboNodes: { [key: string]: LimboNode[] } = {};
  protected limboModel?: LimboModel<T>;

  constructor(
    protected componentId: string,
    model: Required<T>,
    html: string,
  ) {
    this.htmlContainer = document.createElement("div");
    this.htmlTemplate = html;
    this.htmlContainer.innerHTML = this.htmlTemplate;
    this.limboNodes = generateLimboNodes("model", html, this.htmlContainer);
    this.renderComponent(model);
  }

  private renderComponent(model: Required<T>) {
    const creationResponse = LimboModelFactory.createAndBind({ model, LimboNodes: this.limboNodes });
    this.limboModel = creationResponse.model;
    if (creationResponse.toBuild) {
      let builderNode: ModelBuilderNode | null = this.limboModel.getModelBuilder();

      while (builderNode) {
        builderNode.build();
        builderNode = builderNode.next;
      }
    }

    let binderNode: ModelBinderNode | null = this.limboModel.getModelBinder();
    while (binderNode) {
      binderNode.bind();
      binderNode = binderNode.next;
    }

    const componentElement = document.getElementById(this.componentId);
    if (componentElement) {
      this.htmlContainer.childNodes.forEach((node) => componentElement.appendChild(node));
      LimboComponentsBootstrap(componentElement, { parentComponentModel: this.limboModel });
    } else {
      console.error(`Element with id ${this.componentId} not found`);
    }
  }
}
