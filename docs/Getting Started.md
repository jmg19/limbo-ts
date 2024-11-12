# Getting Started
## Add Limbo-Ts to your new SPA project

```shell
npm i limbo-ts
```

## Identify an element to Limbo Bootstrap 

```html
<!-- ... -->

<div id="element-to-be-bootstraped"></div>

<!-- ... -->
```

## Your startup script

```typescript
(() => {
  const appElement = document.querySelector<HTMLDivElement>("#element-to-be-bootstraped");
  if (!appElement) {
    throw new Error("div with id 'element-to-be-bootstraped' is necessary to start the Limbo Application");
  }

  Limbo.Bootstrap(appElement, {
    components: {
      // Here you add the reference of all your Limbo Components
    },
    limboRoutes: [
      // Here you configure the routes of your application
      /* Examples
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
      */
    ],
  });
})();

```

## Reference you startup Script

```html
  <!-- Somewhere in your index.html -->
  <script
      type="module"
      src="[path to your startup script]"
  ></script>
```

## How Limbo works under the hood

Limbo uses HTML DOM to append the components' respective HTML code and links the defined components models' (LimboModel) properties to the elements' attributes and text nodes where these are referenced. To achieve this the LimboModel object is wrapping the model data defined in the component. When a property is updated the object looks for all linked element attributes and text nodes and updates the displayed information.

## How should I organize my code?

The code organization is up to you, so you should choose the code organization style that fits better to you. The examples in the documents place a CSS, an HTML, and a TS file in the same folder as the respective component. The only advice I give is to have one single TS file for each component.

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
    <td width="506"></td>
    <td width="506" align="right">
      <a href="Limbo Component.md">
        Limbo Component &#x21A6;
      </a>
    </td>
  </tr>
</table>