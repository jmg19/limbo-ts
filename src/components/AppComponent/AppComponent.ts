import { LimboComponent, LimboComponentOptions } from "../../lib";
import "./AppComponent.css";
import html from "./AppComponent.html?raw";

export class AppComponent extends LimboComponent<unknown> {
  constructor(componentId: string, options?: LimboComponentOptions<unknown>) {
    super(componentId, html, options);
  }

  protected override onMount(): void {
    console.log("AppComponent mounting...");
  }

  protected override onUnmount(): void {
    console.log("AppComponent unmounting...");
  }
}
