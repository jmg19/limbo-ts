import { ExampleComponent } from "./components/Example/ExampleComponent";
import { NestedComponent } from "./components/NestedComponent/NestedComponent";
import { NestedOfNestedComponent } from "./components/NestedOfNested/NestedOfNestedComponent";
import Limbo from "./lib";
import "./style.css";

Limbo.LimboComponentsBootstrap(document.querySelector<HTMLDivElement>("#app")!, {
  components: { ExampleComponent, NestedComponent, NestedOfNestedComponent },
});
