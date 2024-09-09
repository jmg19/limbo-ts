import { LimboComponent } from "../../lib";
import typescriptLogo from "../../typescript.svg";
import viteLogo from "../../vite.svg";
import "./ExampleComponent.css";
import html from "./ExampleComponent.html?raw";

type ExampleComponentModel = {
  viteLogo: string;
  typescriptLogo: string;
  counter: number;
  nested: {
    value: string;
    nestedOfNested: {
      value: string;
    };
  };
};

export class ExampleComponent extends LimboComponent<ExampleComponentModel> {
  constructor(
    componentId: string,
    model: ExampleComponentModel = { viteLogo, typescriptLogo, counter: 0, nested: { value: "", nestedOfNested: { value: "" } } },
  ) {
    super(componentId, model, html);

    document.getElementById("counter")?.addEventListener("click", () => {
      this.limboModel!.counter++;
    });
  }
}
