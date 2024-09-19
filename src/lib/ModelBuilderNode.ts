export class ModelBuilderNode {
  public next: ModelBuilderNode | null = null;

  constructor(private modelBuilder: () => ModelBuilderNode | null) {}

  public static linkNode(modelBuilderNode: ModelBuilderNode | null, node: ModelBuilderNode) {
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

  build() {
    const node = this.modelBuilder();

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
