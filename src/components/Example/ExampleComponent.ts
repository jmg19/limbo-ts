import { LimboComponent, LimboComponentOptions } from "../../lib";
import "./ExampleComponent.css";
import html from "./ExampleComponent.html?raw";
import typescriptLogo from "/typescript.svg";
import viteLogo from "/vite.svg";

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

  counterClick() {
    this.limboModel.counter++;
  }

  // aaaClick() {
  //   this.limboModel.xpto = "aaa";
  // }

  // bbbClick() {
  //   this.limboModel.xpto = "bbb";
  // }

  // defaultClick() {
  //   this.limboModel.xpto = null;
  // }

  xptoSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.limboModel.xpto = target.value;
  }

  protected override onMount(): void {
    this.setModelData({
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

  protected override onUnmount(): void {
    console.log("ExampleComponent unmounting...");
  }
}
