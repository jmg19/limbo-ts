import { LimboComponent, LimboComponentOptions } from "../../lib";
import "./Bugs.css";
import html from "./Bugs.html?raw";

type BugsComponentModel = {
  name: string;
  description: string;
  image: string;
  powerLevel: number;
  health: number;
};

export class BugsComponent extends LimboComponent<{ bugs: BugsComponentModel[] }> {
  constructor(componentId: string, options?: LimboComponentOptions<{ bugs: BugsComponentModel[] }>) {
    super(componentId, html, options);
  }

  protected override onMount(): void {
    fetch("/Bugs.json").then((response) => {
      response.json().then((data) => {
        this.setModelData({ bugs: data });
      });
    });
  }

  protected override onUnmount(): void {
    console.log("Page1Component unmounting...");
  }

  bugClick(_: Event, index: number) {
    this.limboModel.bugs[index].health -= 10;
  }
}
