import { LimboComponent } from "../../lib";
import "./NestedComponent.css";
import html from "./NestedComponent.html?raw";

type NestedComponentModel = {
  value: string;
  nestedOfNested: {
    value: string;
  };
  array: string[];
};

export class NestedComponent extends LimboComponent<NestedComponentModel> {
  constructor(componentId: string, model: NestedComponentModel) {
    super(componentId, html, model);
  }

  protected override OnComponentLoaded(): void {
    document.getElementById("nested-value")?.addEventListener("change", (event) => {
      this.limboModel!.value = (event.target as HTMLInputElement).value;
    });
  }
}