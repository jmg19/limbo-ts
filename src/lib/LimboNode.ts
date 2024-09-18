type LimboNodeParams = {
  node: Text | HTMLElement;
  modelReferenceInView: string;
  rootReference?: string;
  attributeNameToReplaceValue?: string;
  isTextNode?: boolean;
  modelPrefix?: string;
};

export class LimboNode<T = string | number | boolean | ((...params: unknown[]) => string | number | boolean)> {
  private originalNode: Text | HTMLElement;
  private node: Text | HTMLElement;
  private isTextNode: boolean;
  private attributeNameToReplaceValue: string;
  private modelReferenceInView: string;
  private rootReference?: string;
  private modelPrefix = "model";

  constructor(
    details: LimboNodeParams,
    private limboValue?: T,
  ) {
    this.originalNode = details.node.cloneNode(true) as Text | HTMLElement;
    this.node = details.node;
    this.isTextNode = details.isTextNode || false;
    this.attributeNameToReplaceValue = details.attributeNameToReplaceValue || "";
    this.modelReferenceInView = details.modelReferenceInView;
    this.rootReference = details.rootReference;
    this.modelPrefix = details.modelPrefix || this.modelPrefix;
  }

  public set value(value: T) {
    if (typeof value === "function") {
      this.limboValue = (value as (...params: unknown[]) => T | T)();
    } else {
      this.limboValue = value;
    }

    if (this.isTextNode) {
      this.node.textContent = !this.originalNode.textContent
        ? this.node.textContent
        : this.originalNode.textContent.replace(this.modelReferenceInView, `${value}`);
    }

    if (this.attributeNameToReplaceValue) {
      const originalHtmlElement = this.originalNode as HTMLElement;
      const currentHtmlElement = this.node as HTMLElement;

      const currentAttributeValue = originalHtmlElement.getAttribute(this.attributeNameToReplaceValue);
      const appendedValue = currentAttributeValue ? currentAttributeValue.replace(this.modelReferenceInView, `${value}`) : `${value}`;

      if (this.attributeNameToReplaceValue === "data-limbo-src") {
        currentHtmlElement.setAttribute("src", appendedValue);
      } else {
        currentHtmlElement.setAttribute(this.attributeNameToReplaceValue, appendedValue);
      }
    }
  }

  setRootReference(modelReference: string) {
    this.rootReference = modelReference;
  }

  equals(node: LimboNode): boolean {
    return (
      this.isTextNode === node.isTextNode &&
      this.attributeNameToReplaceValue === node.attributeNameToReplaceValue &&
      this.modelReferenceInView === node.modelReferenceInView &&
      this.rootReference === node.rootReference &&
      this.modelPrefix === node.modelPrefix
    );
  }

  public get modelReference(): string {
    if (this.rootReference) {
      return this.modelReference.replace(this.modelPrefix, this.rootReference);
    }
    return this.modelReferenceInView;
  }

  public get value(): T | undefined {
    return this.limboValue;
  }
}
