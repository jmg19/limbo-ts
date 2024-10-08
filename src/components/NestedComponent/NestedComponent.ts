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

  protected override OnComponentLoaded(): void {
    this.setModel({
      someId: "bla bla bla bla",
      value: "",
      nestedOfNested: {
        value: "",
      },
      array: [],
    });
  }

  onChange(event: Event, abc: boolean) {
    const target = event.target as HTMLInputElement;
    this.limboModel.value = target.value;
    console.log(abc);
  }
}
