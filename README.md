# What is Limbo-Ts?

Limbo-Ts is a web framework designed for vanilla developers who still find some resistance to embracing some other more famous web frameworks or developers who are tired of feeling constrained by these other web frameworks.
It has the goal of offering you an MVC-like approach for your single-page applications that are simple to learn and implement.

# How to get started?

In theory, you can use any local development server in NodeJs to serve your SPA using Limbo-Ts, but because I started this development from a Vite vanilla Typescript project (https://vite.dev/guide), to minimize any unexpected issues, I advise you to get started from there. After you have your project created you just have to get the Limbo-Ts library from npm.

```shell
npm i limbo-ts
```

After installing, you can start by creating some component add the reference to the Limbo-Ts framework.

#### Example

**index.html**
```html
<body>
    <div id="app">
      <div id="SomeComponent" data-limbo-component="SomeComponent"></div>
    </div>
    <script
      type="module"
      src="/src/main.ts"
    ></script>
  </body>
```

**src/main.ts**
```typescript
import { SomeComponent } from "./components/SomeComponent/SomeComponent";
import Limbo from "./lib";
import "./style.css";

(() => {
  const appElement = document.querySelector<HTMLDivElement>("#app");
  if (!appElement) {
    throw new Error("div with id 'app' is necessary to start the Limbo Application");
  }

  Limbo.Bootstrap(appElement, {
    components: {
      SomeComponent,
    },
    limboRoutes: [],
  });
})();
```

**src/components/SomeComponent/SomeComponent.ts**
```typescript
import { LimboComponent, LimboComponentOptions } from "limbo-ts";
import "./SomeComponent.css";
import html from "./SomeComponent.html?raw";

type SomeComponentModel = {
	title: string;
}

export class SomeComponent extends LimboComponent<SomeComponentModel> {

	constructor(componentId: string, options?: LimboComponentOptions<SomeComponentModel>) {
		super(componentId, html, options);	
	}
	
	protected override onMount(): void {
		this.setModelData({
			title: "Hello World!"
		});
		console.log("SomeComponent mounting...");
	}
	
	protected override onUnmount(): void {
	console.log("SomeComponent unmounting...");
	}
}
```

**src/components/SomeComponent/SomeComponent.html**
```html
<h1>{{model.title}}</h1>
```

for more docs you can go to [Getting Started](docs/Getting%20Started.md)
# Contributions

I don't want the library to get too complicated or have a lot of features and tools that in the future could potentially turn into some kind of limitation or bottleneck on the development side. Having said this, additional code to handle Dependencies Injections, HTTP request calls, and others will be not taken into account for this library. I will add in the docs some suggestions to be followed but the purpose is to implement Front End applications your way, so I will only give attention to contributions or requests that will make the current Limbo tools better.

# Support

If you appreciate my work and want to support me:

<a href="https://www.buymeacoffee.com/jmg19" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

