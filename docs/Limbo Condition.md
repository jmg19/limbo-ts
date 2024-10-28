# Limbo Condition

To add a condition where an element and its children elements should be rendered or not you can use the attribute `data-limbo-condition` with the following pattern `data-limbo-condition="model.someProperty is [boolean|string|number|undefined|null]"`.

#### Example
```html
<div id="some-conditional-element" data-limbo-condition="model.someProperty is true">
	<!-- Children Elements Here  -->
</div>

<!-- Or  -->

<div id="some-conditional-element" data-limbo-condition="model.someProperty is 'some string value'">
	<!-- Children Elements Here  -->
</div>

<!-- Or  -->

<div id="some-conditional-element" data-limbo-condition="model.someProperty is 12345">
	<!-- Children Elements Here  -->
</div>

<!-- Or  -->

<div id="some-conditional-element" data-limbo-condition="model.someProperty is undefined">
	<!-- Children Elements Here  -->
</div>

<!-- Or  -->

<div id="some-conditional-element" data-limbo-condition="model.someProperty is null">
	<!-- Children Elements Here  -->
</div>
```