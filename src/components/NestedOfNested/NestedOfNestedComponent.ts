import { LimboComponent, LimboComponentOptions } from "../../lib";
import "./NestedOfNestedComponent.css";
import html from "./NestedOfNestedComponent.html?raw";

type NestedOfNestedComponentModel = {
  value: string;
};

export class NestedOfNestedComponent extends LimboComponent<NestedOfNestedComponentModel> {
  constructor(componentId: string, options?: LimboComponentOptions<NestedOfNestedComponentModel>) {
    super(componentId, html, options);
  }

  protected override OnComponentLoaded(): void {
    const nestedOfInput = this.componentElement?.querySelector("[name='nested-of-input']");
    nestedOfInput?.addEventListener("change", (event) => {
      this.limboModel!.value = (event.target as HTMLInputElement).value;
    });
  }
}
