import Limbo, { LimboMountableElement } from "./Limbo";
import { LimboArray } from "./LimboArray";
import { LimboComponent } from "./LimboComponent";
import { _LimboModel } from "./LimboModel";

export class LimboLoop implements LimboMountableElement {
  private loopElements: { [key: string]: HTMLElement } = {};
  private loopHtml: string = "";
  private _limboNodesIds: { [key: number]: number[] } = {};
  private mountedChilds: { [key: string]: LimboMountableElement[] } = {};
  private array: LimboArray<unknown>;

  constructor(
    private loopId: string,
    private baseLoopElement: HTMLElement,
    private itemName: string,
    private parentComponent: LimboComponent<unknown>,
    array?: LimboArray<unknown>,
  ) {
    this.loopHtml = this.baseLoopElement.outerHTML;
    this.baseLoopElement.id = this.loopId;
    this.baseLoopElement.innerHTML = "";

    if (array) {
      this.array = array;
    } else {
      this.array = new LimboArray();
    }
  }

  get limboNodesIds(): { [key: number]: number[] } {
    return this._limboNodesIds;
  }

  unmount(): void {
    this.unmountChilds();
    this.array.forEach((_, index) => {
      this.loopElements[`${this.itemName}-${index}`].remove();
      Limbo.clearLimboNodes(this._limboNodesIds[index]);
    });
    this.baseLoopElement.remove();
    Limbo.detachLoopFromArrayReference(this.array.getArrayReference(), this);
    Limbo.removeRenderedLoop(this.loopId);
  }

  private mountChilds(startIndex: number, length: number) {
    for (let i = startIndex + 1; i <= length; i++) {
      const item = this.array[i];
      const loopElement = this.loopElements[`${this.itemName}-${i}`];
      if (item instanceof _LimboModel) {
        this.mountedChilds[`${this.itemName}-${i}`] = Limbo.bootstrap(loopElement, {
          loopItemModel: item,
          parentComponent: this.parentComponent,
        });
      } else {
        this.mountedChilds[`${this.itemName}-${i}`] = Limbo.bootstrap(loopElement, { parentComponent: this.parentComponent });
      }
    }
  }

  private unmountChilds(key?: string): void {
    if (key) {
      while (this.mountedChilds[key].length > 0) {
        this.mountedChilds[key].pop()?.unmount();
      }
      delete this.mountedChilds[key];
    } else {
      Object.keys(this.mountedChilds).forEach((key) => {
        while (this.mountedChilds[key].length > 0) {
          this.mountedChilds[key].pop()?.unmount();
        }
        delete this.mountedChilds[key];
      });
      this.mountedChilds = {};
    }
  }

  mount() {
    Limbo.attachLoopToArrayReference(this.array.getArrayReference(), this);
    this.renderLoop();
  }

  attachArray(limboArray: LimboArray<unknown>) {
    const currentArrayLastIndex = this.array.length - 1;
    const newArrayLastIndex = limboArray.length - 1;
    this.array = limboArray;
    this.refresh(currentArrayLastIndex, newArrayLastIndex);
  }

  private refresh(currentArrayLastIndex: number, newArrayLastIndex: number) {
    if (currentArrayLastIndex < newArrayLastIndex) {
      for (let i = currentArrayLastIndex + 1; i <= newArrayLastIndex; i++) {
        this.renderLoopElement(i);
      }

      this.array.bindValues();

      this.mountChilds(currentArrayLastIndex, newArrayLastIndex);

      this.parentComponent.bindEvents();
      this.parentComponent.bindLimboRoutingLinks();
    } else if (currentArrayLastIndex > newArrayLastIndex) {
      for (let i = currentArrayLastIndex; i > newArrayLastIndex; i--) {
        this.unmountChilds(`${this.itemName}-${i}`);
        this.loopElements[`${this.itemName}-${i}`].remove();
        delete this.loopElements[`${this.itemName}-${i}`];
        Limbo.clearLimboNodes(this._limboNodesIds[i]);
        delete this._limboNodesIds[i];
      }

      this.array.bindValues();
    } else {
      this.array.bindValues();
    }
  }

  private renderLoop() {
    this.array.forEach((_, index) => {
      this.renderLoopElement(index);
    });

    this.array.bindValues();

    this.mountChilds(0, this.array.length);

    this.parentComponent.bindEvents();
    this.parentComponent.bindLimboRoutingLinks();
  }

  private renderLoopElement(index: number) {
    const auxElement = this.baseLoopElement.parentElement?.cloneNode(true) as HTMLElement;
    auxElement.innerHTML = this.loopHtml.replace(/({{#index}})/g, `${index}`);
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
