# Limbo Model

Each component has an instance `limboModel` of type `LimboModel<T>` where `T` is the generic type defined when you extend the class `LimboComponent<T>`. On the component constructor, this instance is built based on the properties defined. If no data is defined in the constructor, an instance of `LimboModel<T>` with no data is created. We can rebuild our limbo model at any moment using the function `LimboComponent<T>.setModelData<T>(data: T)`. This means that if you have a type with an undefinable property, you have to explicitly reference it at the constructor or using the function `setModelData<T>(data: T)` otherwise you will not be able to update the respective references in the views. Under the hood when a limbo model is built all getters and setters for the defined data properties are created and it is for that reason that we have to define all properties even if they can initially be undefinable.

#### Examples
```typescript

type SomeComponentModel = {
	title?: string;
}

// When data defined in constructor
export class SomeComponent extends LimboComponent<SomeComponentModel> {

	constructor(componentId: string) {
		super(componentId, html, {
			title: undefined
		});	
	}
	
	protected override onMount(): void {
		// Will update title value defined in the constructor
		this.limboModel.title = "Hello World" 
	}
	
	protected override onUnmount(): void {
	console.log("SomeComponent unmounting...");
	}
}

// When data not defined in constructor
export class SomeComponent extends LimboComponent<SomeComponentModel> {

	constructor(componentId: string) {
		super(componentId, html, {});	
	}
	
	protected override onMount(): void {
		// Will NOT update title because setter was never created
		this.limboModel.title = "Hello World" 
	}
	
	protected override onUnmount(): void {
	console.log("SomeComponent unmounting...");
	}
}

// When data not defined in constructor but defined using setModelData.
export class SomeComponent extends LimboComponent<SomeComponentModel> {

	constructor(componentId: string) {
		super(componentId, html, {});	
	}
	
	protected override onMount(): void {
		this.setModelData({
			// Will update the reference on the view after rebuilding the limboModel instance
			title: "Hello World!"
		}); 
	}
	
	protected override onUnmount(): void {
		console.log("SomeComponent unmounting...");
	}

	changeTitle(e: Event): void {
		const target = event.target as HTMLInputElement;
		// Will uptade the reference invoking the setter for the "title" property
	    this.limboModel.title = target.value; 
	}
}

```

# `src` and `data-limbo-src` attributes

When we bind a model reference to the `src` attribute our DOM will generate an error because when an image element is added to it our browser will try to load this value as a URL and the defined value in it is not a valid path. To avoid this issue we are checking for the attribute `data-limbo-src` and updating the `src` attribute when its related model reference is resolved or updated. So it is advisable to use the attribute `data-limbo-src` when you need a `src` value based on a reference value from a model

#### Example

**SomeComponent.html**
```html
<h1>{{model.title}}</h1>
<img data-limbo-src="{{model.imageUrl}}" alt="{{model.imageName}}" />
```

# Injections

To make easier to setup your own dependency injections or use your preferred library, it was provided the property `injections` in the type `LimboBootstrapOptions`.

**`LimboBootstrapOptions<T = unknown, S = unknown>`**
```typescript

type LimboBootstrapOptions<T = unknown, S = unknown> = {
  components?: { [key: string]: Type<LimboComponent<unknown>> };
  limboRoutes?: { routingName: string; routes: { path: string; component: Type<LimboComponent<unknown>> }[] }[];
  parentComponent?: LimboComponent<unknown>;
  parentComponentModel?: LimboModel<unknown>;
  loopItemModel?: LimboModel<unknown>;
  modelPrefix?: string;
  routingParams?: T;
  firstLoad?: boolean;
  injections?: S; // on this property you can inject anything you want to use in your Limbo Components
};

```

#### Example

**Some dependencies**
```typescript
export interface IAbcService {
	getAbcSubsets(): any[];
	getAbcSubset(name: string): any
}

export class AbcService implements IAbcService {

	public async getAbcSubsets(): Promise<any[]> {
		// logic to get some data and return
	}
	
	public async getAbcSubset(name: string): Promise<any> {
		// logic to get some data and return
	}
}

export interface IServicesFactory {
	createAbsService(): IAbcService;
}

export class ServicesFactory implements IServicesFactory {

	public createAbsService(): IAbcService {
		return new AbcService();
	}
}
```

**main.ts**
```typescript

// this type can be anything that fits your needs
export type MyAppInjections {
	servicesFactory: IServicesFactory
}

(() => {
  const appElement = document.querySelector<HTMLDivElement>("#element-to-be-bootstraped");
  if (!appElement) {
    throw new Error("div with id 'element-to-be-bootstraped' is necessary to start the Limbo Application");
  }

  Limbo.Bootstrap(appElement, {
    components: {
      PageAbcComponent,
      PageXptoComponent,
      HomeComponent,
      PageAbcSubSetComponent
    },
    limboRoutes: [
      {
        routingName: "main-route",
        routes: [
          { component: PageAbcComponent, path: "/Abc" },
          { component: PageXptoComponent, path: "/Xpto" },
          { component: HomeComponent, path: "/" },
        ],
      },
      {
        routingName: "sub-route",
        routes: [{ component: PageAbcSubSetComponent, path: "/Abc/:name" }],
      },
    ],
    injections: {
	    servicesFactory: new ServicesFactory();
    }
  });
})();

```

**PageAbcSubSetComponent**
```typescript

type PageAbcSubSetComponentModel = {
  name: string;
  description: string;
  image: string;
  powerLevel: number;
  health: number;
};

type RouteParams = {
  name: string;
};

export class PageAbcSubSetComponent extends LimboComponent<BugComponentModel> {
  private name: string = "";
  private servicesFactory: IServiceFactory;

  constructor(componentId: string, options?: LimboComponentOptions<BugComponentModel>) {
    super(componentId, html, options);
    this.name = options?.routingParams?.get<RouteParams>().name || "";
    // here get your injection typed for your previous defened structure
    this.servicesFactory = options?.injections?.get<MyAppInjections>()!;
  }

  protected override async onMount(): Promise<void> {
	const service = this.servicesFactory.createAbsService();
    const data = await service.getAbcSubset(name);
    // Do something with your data
  }

  protected override onUnmount(): void {
    console.log("BugComponent unmounting...");
  }
}

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
      <a href="Limbo Routing.md">
        &#x21A4; Limbo Routing
      </a>
    </td>
    <td width="506" align="right">
    </td>
  </tr>
</table>