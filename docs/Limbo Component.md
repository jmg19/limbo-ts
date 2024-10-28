# Limbo Component

For each component, you have to declare a class that extends the **LimboComponent\<T\>** abstract class. Additionally, if you need to associate a data structure as a component model you can define the respective type that represents it.

#### Example

**SomeComponent.ts**
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

**SomeComponent.html**
```html
<h1>{{model.title}}</h1>
```

**SomeComponent.css**
```CSS
#SomeComponentId h1 {
	font-size: 2em;
}

/* or */

[data-limbo-component="SomeComponent"] h1 {
	font-size: 2em;
}
```

To append your component to the HTML DOM you have to use the attribute `data-limbo-component` having as value the class name of your component like:

```html
	<div id="some-id-for-your-component" data-limbo-component="SomeComponent"></div>
```

### Limbo Events

You can easily bind an HTML DOM event to a rendered element in your component. For that you can use the attribute `data-limbo-event` with the following pattern `eventName:methodName:param1:...:paramN`. On your component class you just have to define corresponding method like the following:

```typescript
// (...)
export class SomeComponent extends LimboComponent<SomeComponentModel> {

	// (...)

	// param types are simply indicative here. The types on the specific position must match your real need.
	methodName(event: Event, param1: string, param2: number, ... )
	{
		// Your onEvent logic here
	}

	// (...)
}
```

To add multiple events to the same element, you must divide each setup using a semicolon. (`eventName:methodName:param1:...:paramN;eventName:methodName:param1:...:paramN;...;eventName:methodName:param1:...:paramN`) 

#### Example

**SomeComponent.ts**
```typescript
import { LimboComponent, LimboComponentOptions } from "limbo-ts";
import "./SomeComponent.css";
import html from "./SomeComponent.html?raw";

type SomeComponentModel = {
  title: string;
  valueMultipleEvent: string;
  counter: number;
}

export class SomeComponent extends LimboComponent<SomeComponentModel> {
  
  constructor(componentId: string, options?: LimboComponentOptions<SomeComponentModel>) {
    super(componentId, html, options);
  }
  
  protected override onMount(): void {
    this.setModelData({
      title: "Hello World!",
      valueMultipleEvent: "",
      counter: 0
    });
  }

  protected override onUnmount(): void {
    console.log("SomeComponent unmounting...");
  }

  onChange(event: Event) {
      const target = event.target as HTMLInputElement;
      this.limboModel.title = target.value;
  }

  counterClick(_: Event, increment: number) {
      this.limboModel.counter += increment;
  }

  onChangeValue(event: Event) {
      const target = event.target as HTMLInputElement;
      this.limboModel.valueMultipleEvent = target.value;
  }

  onChangeValueEnds(event: Event) {
      const target = event.target as HTMLInputElement;
      console.log(`${this.limboModel.valueMultipleEvent} should be equal to ${target.value}`);
  }
}
```

**SomeComponent.html**
```html
<h1>{{model.title}}</h1>
<button
      id="counter"
      type="button"
      data-limbo-event="click:counterClick:5"
>
      Count is {{model.counter}}
</button>
<input id="textbox-title" type="text" placeholder="set some value" value="{{model.title}}" data-limbo-event="change:onChange" />
<input id="textbox-value-multiple-event" type="text" placeholder="set some value" value="{{model.title}}" data-limbo-event="keyup:onChangeValue;change:onChangeValueEnds" />
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
      <a href="Getting Started.md">
        &#x21A4; Getting Started
      </a>
    </td>
    <td width="506" align="right">
      <a href="Limbo Condition.md">
        Limbo Condition &#x21A6;
      </a>
    </td>
  </tr>
</table>