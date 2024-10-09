import { AppComponent } from "./components/AppComponent/AppComponent";
import { BugComponent } from "./components/Bug/Bug";
import { BugsComponent } from "./components/Bugs/Bugs";
import { ExampleComponent } from "./components/Example/ExampleComponent";
import { HomeComponent } from "./components/HomePage/HomePage";
import { NestedComponent } from "./components/NestedComponent/NestedComponent";
import { NestedOfNestedComponent } from "./components/NestedOfNested/NestedOfNestedComponent";
import { Page1Component } from "./components/Page1/Page1";
import Limbo from "./lib";
import "./style.css";

(() => {
  const appElement = document.querySelector<HTMLDivElement>("#app");
  if (!appElement) {
    throw new Error("div with id 'app' is necessary to start the Limbo Application");
  }

  Limbo.Bootstrap(appElement, {
    components: {
      ExampleComponent,
      NestedComponent,
      NestedOfNestedComponent,
      Page1Component,
      BugsComponent,
      BugComponent,
      HomeComponent,
      AppComponent,
    },
    limboRoutes: [
      {
        routingName: "main-route",
        routes: [
          { component: Page1Component, path: "/Page1" },
          { component: BugsComponent, path: "/Bugs" },
          { component: HomeComponent, path: "/" },
        ],
      },
      {
        routingName: "bugs-route",
        routes: [{ component: BugComponent, path: "/Bugs/:name" }],
      },
    ],
  });
})();
