import { LimboComponent, LimboComponentOptions } from "../../lib";
import "./Page1.css";
import html from "./Page1.html?raw";

type Page1ComponentModel = {
  value: string;
};

export class Page1Component extends LimboComponent<Page1ComponentModel> {
  constructor(componentId: string, options?: LimboComponentOptions<Page1ComponentModel>) {
    super(componentId, html, options);
  }

  protected override onMount(): void {
    this.setModelData({
      value: "",
    });
  }

  protected override onUnmount(): void {
    console.log("Page1Component unmounting...");
  }

  showValue() {
    this.limboModel.value = "xpto";
  }
}
