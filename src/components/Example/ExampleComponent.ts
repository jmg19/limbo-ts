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
    array: {
      value: string;
    }[];
    booleanValue: boolean;
  };
};

export class ExampleComponent extends LimboComponent<ExampleComponentModel> {
  constructor(componentId: string, model: ExampleComponentModel) {
    super(componentId, html, model);
  }

  protected override OnComponentLoaded(): void {
    document.getElementById("counter")?.addEventListener("click", () => {
      this.limboModel.counter++;
    });

    this.setModel({
      viteLogo,
      typescriptLogo,
      counter: 0,
      nested: {
        value: "",
        nestedOfNested: { value: "" },
        array: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
        booleanValue: true,
      },
    });

    setTimeout(() => {
      this.limboModel.nested.nestedOfNested = { value: "nestedOfNested after change" };
      this.limboModel.nested.array = [{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }, { value: "5" }, { value: "6" }];
      this.limboModel.nested.booleanValue = false;

      setTimeout(() => {
        this.limboModel.nested.booleanValue = true;
        this.limboModel.nested.array = [{ value: "bbb" }, { value: "aaa" }];

        setTimeout(() => {
          //this.limboModel.nested.booleanValue = true;
          this.limboModel.nested.array = [{ value: "3" }, { value: "4" }, { value: "5" }, { value: "6" }];
        }, 5000);
      }, 5000);
    }, 5000);
  }
}
