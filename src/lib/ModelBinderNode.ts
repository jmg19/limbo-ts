export class ModelBinderNode {
  public next: ModelBinderNode | null = null;

  constructor(private modelBind: () => ModelBinderNode | null) {}

  public static linkNode(modelBuilderNode: ModelBinderNode | null, node: ModelBinderNode) {
    let current = modelBuilderNode;
    if (!current) {
      return node;
    } else {
      while (current.next) {
        current = current.next;
      }
      current.next = node;
    }
    return modelBuilderNode;
  }

  bind() {
    const node = this.modelBind();

    if (node) {
      if (!this.next) {
        this.next = node;
      } else {
        let nodeTolink = this.next;
        while (nodeTolink) {
          if (nodeTolink.next === null) {
            nodeTolink.next = node;
            break;
          }
          nodeTolink = nodeTolink.next;
        }
      }
    }
  }
}
