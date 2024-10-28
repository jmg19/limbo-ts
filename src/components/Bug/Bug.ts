import { LimboComponent, LimboComponentOptions } from "../../lib";
import "./Bug.css";
import html from "./Bug.html?raw";

type BugComponentModel = {
  name: string;
  description: string;
  image: string;
  powerLevel: number;
  health: number;
};

type RouteParams = {
  name: string;
};

export class BugComponent extends LimboComponent<BugComponentModel> {
  private bugName: string = "";

  constructor(componentId: string, options?: LimboComponentOptions<BugComponentModel>) {
    super(componentId, html, options);
    this.bugName = (options?.routingParams as RouteParams | undefined)?.name || "";
  }

  protected override onMount(): void {
    fetch("/Bugs.json").then((response) => {
      response.json().then((data) => {
        const bug = data.find((bug: BugComponentModel) => bug.name === this.bugName);
        if (bug) {
          this.setModelData(bug);
        }
      });
    });
  }

  protected override onUnmount(): void {
    console.log("BugComponent unmounting...");
  }
}
