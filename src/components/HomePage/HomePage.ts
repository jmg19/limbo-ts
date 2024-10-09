import { LimboComponent, LimboComponentOptions } from "../../lib";
import "./HomePage.css";
import html from "./HomePage.html?raw";
import typescriptLogo from "/typescript.svg";
import viteLogo from "/vite.svg";

type HomeComponentModel = {
  viteLogo: string;
  typescriptLogo: string;
  counter: number;
};

export class HomeComponent extends LimboComponent<HomeComponentModel> {
  constructor(componentId: string, options?: LimboComponentOptions<HomeComponentModel>) {
    super(componentId, html, options);
  }

  protected override onMount(): void {
    this.setModelData({
      viteLogo,
      typescriptLogo,
      counter: 0,
    });
  }

  protected override onUnmount(): void {
    console.log("Page1Component unmounting...");
  }

  counterClick() {
    this.limboModel.counter++;
  }
}
