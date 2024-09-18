import { ExampleComponent } from "./components/Example/ExampleComponent";
import { NestedComponent } from "./components/NestedComponent/NestedComponent";
import { NestedOfNestedComponent } from "./components/NestedOfNested/NestedOfNestedComponent";
import Limbo from "./lib";
import "./style.css";

(() => {
  const appElement = document.querySelector<HTMLDivElement>("#app");
  if (!appElement) {
    console.error("div with id 'app' is necessary to start the Limbo Application");
    return;
  }

  Limbo.LimboComponentsBootstrap(appElement, {
    components: { ExampleComponent, NestedComponent, NestedOfNestedComponent },
  });
})();
