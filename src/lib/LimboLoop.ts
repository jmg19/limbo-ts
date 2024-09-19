import { LimboArray } from "./LimboArray";
import LimboComponentsBootstrap from "./LimboBootstrap";
import { _LimboModel } from "./LimboModel";
import { LimboNode } from "./LimboNode";
import { generateLimboNodes } from "./utils";

export class LimboLoop {
  private limboNodes: { [key: string]: LimboNode[] } = {};
  private loopElements: { [key: string]: HTMLElement } = {};

  constructor(
    private loopId: string,
    private baseLoopElement: HTMLElement,
    private itemName: string,
    private array: LimboArray<unknown>,
  ) {
    this.renderComponent();
  }

  private async renderComponent() {
    this.baseLoopElement.id = `loop-${this.loopId}`;

    this.array.forEach((_, index) => {
      const auxElement = document.createElement("div");
      auxElement.appendChild(this.baseLoopElement.cloneNode(true));
      auxElement.innerHTML = auxElement.innerHTML.replace("{{#index}}", `${index}`);
      const newElement = auxElement.firstElementChild as HTMLElement;
      newElement.removeAttribute("data-limbo-loop");
      newElement.id = `${this.baseLoopElement.id}-${index}`;

      const itemLimboNodes = generateLimboNodes(
        this.itemName,
        newElement.outerHTML,
        newElement,
        `${this.array.getArrayReference()}[${index}]`,
      );
      for (const key in itemLimboNodes) {
        if (!this.limboNodes[key]) {
          this.limboNodes[key] = [];
        }
        this.limboNodes[key].push(...itemLimboNodes[key]);
      }

      this.array.addLoopLimboNodes(itemLimboNodes, index, this.itemName);
      this.loopElements[`${this.itemName}-${index}`] = newElement;

      this.baseLoopElement.parentNode?.insertBefore(newElement, this.baseLoopElement);
    });

    this.baseLoopElement.style.display = "none";

    this.array.bindValues();

    this.array.forEach((item, index) => {
      if (item instanceof _LimboModel) {
        const loopElement = this.loopElements[`${this.itemName}-${index}`];
        LimboComponentsBootstrap(loopElement, { loopItemModel: item });
      }
    });
  }
}
