import Limbo from "./Limbo";
import { LimboArray } from "./LimboArray";
import { _LimboModel } from "./LimboModel";

export class LimboLoop {
  private loopElements: { [key: string]: HTMLElement } = {};
  private loopHtml: string = "";
  private _limboNodesIds: { [key: number]: number[] } = {};

  constructor(
    private loopId: string,
    private baseLoopElement: HTMLElement,
    private itemName: string,
    private array: LimboArray<unknown>,
  ) {
    this.loopHtml = this.baseLoopElement.outerHTML;
    this.baseLoopElement.id = this.loopId;
    this.baseLoopElement.innerHTML = "";
    this.array.addLimboLoop(this);
    this.renderLoop();
  }

  get limboNodesIds(): { [key: number]: number[] } {
    return this._limboNodesIds;
  }

  detachFromModel() {
    this.array.removeLimboLoop(this);
  }

  async refresh(array: LimboArray<unknown>) {
    const currentArrayLastIndex = this.array.length - 1;
    const newArrayLastIndex = array.length - 1;
    this.array = array;

    if (currentArrayLastIndex < newArrayLastIndex) {
      this.baseLoopElement.style.display = "";

      for (let i = currentArrayLastIndex + 1; i <= newArrayLastIndex; i++) {
        this.renderLoopElement(i);
      }

      this.baseLoopElement.style.display = "none";

      this.array.bindValues();

      for (let i = currentArrayLastIndex + 1; i <= newArrayLastIndex; i++) {
        const item = this.array[i];
        if (item instanceof _LimboModel) {
          const loopElement = this.loopElements[`${this.itemName}-${i}`];
          Limbo.bootstrap(loopElement, { loopItemModel: item });
        }
      }
    } else if (currentArrayLastIndex > newArrayLastIndex) {
      for (let i = currentArrayLastIndex; i > newArrayLastIndex; i--) {
        this.loopElements[`${this.itemName}-${i}`].remove();
        delete this.loopElements[`${this.itemName}-${i}`];
        Limbo.clearLimboNodes(this._limboNodesIds[i]);
        delete this._limboNodesIds[i];
      }

      Limbo.deBootstrap();
      this.array.bindValues();
    } else {
      this.array.bindValues();
    }
  }

  private async renderLoop() {
    this.array.forEach((_, index) => {
      this.renderLoopElement(index);
    });

    this.baseLoopElement.style.display = "none";

    this.array.bindValues();

    this.array.forEach((item, index) => {
      if (item instanceof _LimboModel) {
        const loopElement = this.loopElements[`${this.itemName}-${index}`];
        Limbo.bootstrap(loopElement, { loopItemModel: item });
      }
    });
  }

  private renderLoopElement(index: number) {
    const auxElement = document.createElement("div");
    auxElement.innerHTML = this.loopHtml.replace("{{#index}}", `${index}`);
    const newElement = auxElement.firstElementChild as HTMLElement;
    newElement.removeAttribute("data-limbo-loop");
    newElement.dataset.limboLoopItem = "true";
    newElement.id = `${this.baseLoopElement.id}-${index}`;

    this._limboNodesIds[index] = Limbo.generateLimboNodes(
      this.itemName,
      newElement.outerHTML,
      newElement,
      this.array.getArrayIndexReference(index),
      this.itemName,
    );

    this.loopElements[`${this.itemName}-${index}`] = newElement;

    this.baseLoopElement.parentNode?.insertBefore(newElement, this.baseLoopElement);
  }
}
