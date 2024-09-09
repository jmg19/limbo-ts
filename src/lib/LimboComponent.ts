import LimboComponentsBootstrap from "./LimboBootstrap";
import { LimboModel, LimboModelFactory } from "./LimboModel";
import { LimboNode } from "./LimboNode";
import { ModelBinderNode } from "./ModelBinderNode";
import { ModelBuilderNode } from "./ModelBuilderNode";

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
    this.renderComponent(html, model);
  }

  private renderComponent(html: string, model: Required<T>) {
    this.htmlTemplate = html;
    this.htmlContainer.innerHTML = this.htmlTemplate;

    const regexIt = this.htmlTemplate.matchAll(/([a-zA-z-]+)="[^"]*({{model\..+}})[^"]*"/g);
    for (const match of regexIt) {
      const attributeName = match[1];
      const modelReference = match[2];

      const selectorString = `[${attributeName}*="${modelReference}"]`;
      const node = this.htmlContainer.querySelector(selectorString) as HTMLElement;

      if (node) {
        if (!this.limboNodes[modelReference]) {
          this.limboNodes[modelReference] = [];
        }

        if (attributeName !== "data-limbo-model") {
          this.limboNodes[modelReference].push(
            new LimboNode({
              node,
              modelReferenceInView: modelReference,
              attributeNameToReplaceValue: attributeName,
            }),
          );
        }
      }
    }

    const treeWalker = document.createTreeWalker(this.htmlContainer, NodeFilter.SHOW_TEXT, (node) => {
      const textNodeRegex = /{{model\..+}}/g;
      const result = textNodeRegex.test((node as Text).textContent || "");
      return result ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    });

    let currentNode = treeWalker.nextNode();
    while (currentNode) {
      const node = currentNode as Text;

      if (node.textContent) {
        const textNodeRegex = /{{model\..+}}/g;
        const matchResult = node.textContent.match(textNodeRegex);

        if (matchResult && matchResult.length > 0) {
          const modelReference = matchResult[0];
          if (!this.limboNodes[modelReference]) {
            this.limboNodes[modelReference] = [];
          }
          this.limboNodes[modelReference].push(
            new LimboNode({
              node,
              modelReferenceInView: modelReference,
              isTextNode: true,
            }),
          );
        }
      }
      currentNode = treeWalker.nextNode();
    }

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
