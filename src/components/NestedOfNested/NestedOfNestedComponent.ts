import { LimboComponent } from "../../lib";
import "./NestedOfNestedComponent.css";
import html from "./NestedOfNestedComponent.html?raw";

type NestedOfNestedComponentModel = {
  value: string;
};

export class NestedOfNestedComponent extends LimboComponent<NestedOfNestedComponentModel> {
  constructor(componentId: string, model: NestedOfNestedComponentModel = { value: "" }) {
    super(componentId, model, html);
  }

  protected override OnComponentLoaded(): void {
    document.getElementById("nested-value-2")?.addEventListener("change", (event) => {
      this.limboModel!.value = (event.target as HTMLInputElement).value;
    });
  }
}
