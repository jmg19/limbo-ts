import { LimboComponent, LimboComponentOptions } from "../../lib";
import "./NestedComponent.css";
import html from "./NestedComponent.html?raw";

type NestedComponentModel = {
  someId: string;
  value: string;
  nestedOfNested: {
    value: string;
  };
  array: string[];
};

export class NestedComponent extends LimboComponent<NestedComponentModel> {
  constructor(componentId: string, options?: LimboComponentOptions<NestedComponentModel>) {
    super(componentId, html, options);
  }

  protected override onMount(): void {
    this.setModelData({
      someId: "bla bla bla bla",
      value: "",
      nestedOfNested: {
        value: "",
      },
      array: [],
    });
  }

  protected override onUnmount(): void {
    console.log("NestedComponent unmounting...");
  }

  onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.limboModel.value = target.value;
  }
}
