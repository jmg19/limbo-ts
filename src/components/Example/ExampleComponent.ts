import { LimboComponent, LimboComponentOptions } from "../../lib";
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
  xpto: string | null;
};

export class ExampleComponent extends LimboComponent<ExampleComponentModel> {
  constructor(componentId: string, options?: LimboComponentOptions<ExampleComponentModel>) {
    super(componentId, html, options);
  }

  protected override OnComponentLoaded(): void {
    document.getElementById("counter")?.addEventListener("click", () => {
      this.limboModel.counter++;
    });

    document.getElementById("btn-show-aaa")?.addEventListener("click", () => {
      this.limboModel.xpto = "aaa";
      this.limboModel.nested = {
        value: "aaa option rendered",
        nestedOfNested: { value: "aaa neste of nested" },
        array: [
          { value: "1" },
          { value: "2" },
          { value: "3" },
          { value: "14" },
          { value: "5" },
          { value: "6" },
          { value: "7" },
          { value: "8" },
        ],
        booleanValue: true,
      };
    });

    document.getElementById("btn-show-bbb")?.addEventListener("click", () => {
      this.limboModel.xpto = "bbb";
      this.limboModel.nested = {
        value: "bbb option rendered",
        nestedOfNested: { value: "bbb neste of nested" },
        array: [{ value: "bbb" }, { value: "aaa" }],
        booleanValue: true,
      };
    });

    document.getElementById("btn-show-default")?.addEventListener("click", () => {
      this.limboModel.xpto = "";
      this.limboModel.nested = {
        value: "default option rendered",
        nestedOfNested: { value: "default nested of nested" },
        array: [{ value: "3" }, { value: "4" }, { value: "5" }, { value: "6" }],
        booleanValue: true,
      };
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
      xpto: null,
    });

    // setTimeout(() => {
    //   this.limboModel.xpto = "aaa";
    //   setTimeout(() => {
    //     this.limboModel.xpto = "bbb";
    //   }, 5000);
    // }, 5000);

    // setTimeout(() => {
    //   this.limboModel.nested.nestedOfNested = { value: "nestedOfNested after change" };
    //   this.limboModel.nested.array = [{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }, { value: "5" }, { value: "6" }];
    //   this.limboModel.nested.booleanValue = true;
    //   this.limboModel.xpto = "aaa";

    //   setTimeout(() => {
    //     //this.limboModel.nested.booleanValue = true;
    //     this.limboModel.nested.array = [{ value: "bbb" }, { value: "aaa" }];
    //     this.limboModel.xpto = "bbb";

    //     setTimeout(() => {
    //       //this.limboModel.nested.booleanValue = true;
    //       this.limboModel.nested.array = [{ value: "3" }, { value: "4" }, { value: "5" }, { value: "6" }];
    //       this.limboModel.xpto = "ccc";
    //     }, 5000);
    //   }, 5000);
    // }, 5000);
  }
}
