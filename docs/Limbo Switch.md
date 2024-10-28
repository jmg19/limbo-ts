# Limbo Switch

If in some context you need to have a switch-like rendering logic for your HTML code you add an element with the attribute `data-limbo-switch="{{[model reference]]}}"` to reference the model property evaluated and in this element add correspondent elements with attributes `data-limbo-switch-case="[case value]"` and `data-limbo-switch-default`.

#### Example


```html
  <div data-limbo-switch="{{model.somePropertyValue}}">
    <div data-limbo-switch-case="aaa">
      <h4>Switch Case: {{model.somePropertyValue}}</h4>
      <div id="NestedComponent" data-limbo-component="NestedComponent" data-limbo-model="{{model.nested}}"></div>  
    </div>
    <div data-limbo-switch-case="bbb" >      
      <p> Say hello to case bbb</p>  
    </div>
    <div data-limbo-switch-default >
      <h4>Default Switch Case</h4>
      <p>No matching value. Default rendering load instead</p>  
    </div>
  </div>
```