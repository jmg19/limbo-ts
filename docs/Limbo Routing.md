# Limbo Routing

To implement navigation across your SPA you can use our Limbo routing solution. Each configured route will load the respective Limbo component inside the defined element for that same purpose. That element should use the attribute `data-limbo-routing` and its value should match one of the routings defined in the Limbo bootstrap.  Limbo supports the existence of multiple routes across the application. To reference a Limbo route you should use an anchor with the attribute `data-limbo-href` instead of `href`
#### Examples

**main.ts**
```typescript

import { AppComponent } from "./components/AppComponent/AppComponent";
import { BugComponent } from "./components/Bug/BugComponent";
import { BugsComponent } from "./components/Bugs/BugsComponent";
import { HomeComponent } from "./components/HomePage/HomeComponent";
import { Page1Component } from "./components/Page1/Page1Component";
import Limbo from "./lib";
import "./style.css";

(() => {
  const appElement = document.querySelector<HTMLDivElement>("#app");
  if (!appElement) {
    throw new Error("div with id 'app' is necessary to start the Limbo Application");
  }

  Limbo.Bootstrap(appElement, {
    components: {
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

```

**AppComponent.html**
```html

<div>
  <ul>
    <li><a data-limbo-href="/" >Home</a></li>
    <li><a data-limbo-href="/Page1" >Page 1</a></li>
    <li><a data-limbo-href="/Bugs" >Bugs</a></li>    
  </ul>
  <div data-limbo-routing="main-route"></div>
</div>

```


**BugsComponent.html**
```html

<h1>The bugs page</h1>
<p></p>
<div class="bugs-content">
  <div class="bugs-list">
    <div>
      <table>
        <thead>
          <tr>
            <th>name</th>
            <th>powerLevel</th>
            <th>health</th>
          </tr>
        </thead>
        <tbody>
          <tr data-limbo-loop="{{bug of model.bugs}}" >
            <td>
              <a data-limbo-href="/Bugs/{{bug.name}}" >{{bug.name}}</a>
            </td>
            <td>{{bug.powerLevel}}</td>
            <td>{{bug.health}}</td>
          </tr>
        </tbody> 
      </table>
    </div>
  </div>
  <div class="bug-container">
    <div data-limbo-routing="bugs-route"></div>
  </div>
</div>

```

Because Limbo looks for a partial match in one of the routes, the shortest ones must come after the longer ones.

**Example**
```typescript

  Limbo.Bootstrap(appElement, {
    components: {
      //...
    },
    limboRoutes: [
      {
        routingName: "example-route",
        routes: [
	      // this must be the desired order.  
          { component: ExamplesComponent, path: "/examples/:id" },
          { component: ExampleComponent, path: "/examples" },
          { component: HomeComponent, path: "/" },
        ],
      }
  });

// Don't do ...

Limbo.Bootstrap(appElement, {
    components: {
      //...
    },
    limboRoutes: [
      {
        routingName: "example-route",
        routes: [	                  
          { component: ExampleComponent, path: "/examples" },
          { component: HomeComponent, path: "/" },
          { component: ExamplesComponent, path: "/examples/:id" }, // The path '/examples/something' will never hit this route because it partially matches the route '/examples' first.
        ],
      }
  });

// or ...

Limbo.Bootstrap(appElement, {
    components: {
      //...
    },
    limboRoutes: [
      {
        routingName: "example-route",
        routes: [
          { component: HomeComponent, path: "/" }, // All paths will hit this route.                  
          { component: ExamplesComponent, path: "/examples/:id" },
          { component: ExampleComponent, path: "/examples" },          
        ],
      }
  });

```

<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

___

<table width="1012">
  <tr>
    <td width="506">
      <a href="Limbo Loop.md">
        &#x21A4; Limbo Loop
      </a>
    </td>
    <td width="506" align="right">
      <a href="More to know about.md">
        More to know about &#x21A6;
      </a>
    </td>
  </tr>
</table>