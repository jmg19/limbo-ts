import { LimboNode } from "./LimboNode";

export const generateLimboNodes: (modelName: string, html: string, htmlContainer: HTMLElement) => { [key: string]: LimboNode[] } = (
  modelName,
  html,
  htmlContainer,
) => {
  const limboNodes: { [key: string]: LimboNode[] } = {};
  const regex = new RegExp(`([a-zA-z-]+)="[^"]*({{${modelName}\\..+}})[^"]*"`, "g");
  const regexIt = html.matchAll(regex);
  for (const match of regexIt) {
    const attributeName = match[1];
    const modelReference = match[2];

    const selectorString = `[${attributeName}*="${modelReference}"]`;
    const node = htmlContainer.querySelector(selectorString) as HTMLElement;

    if (node) {
      if (!limboNodes[modelReference]) {
        limboNodes[modelReference] = [];
      }

      if (attributeName !== "data-limbo-model") {
        limboNodes[modelReference].push(
          new LimboNode({
            node,
            modelReferenceInView: modelReference,
            attributeNameToReplaceValue: attributeName,
          }),
        );
      }
    }
  }

  const treeWalker = document.createTreeWalker(htmlContainer, NodeFilter.SHOW_TEXT, (node) => {
    const textNodeRegex = new RegExp(`{{${modelName}\\..+}}`, "g");
    const result = textNodeRegex.test((node as Text).textContent || "");
    return result ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  });

  let currentNode = treeWalker.nextNode();
  while (currentNode) {
    const node = currentNode as Text;

    if (node.textContent) {
      const textNodeRegex = new RegExp(`{{${modelName}\\..+}}`, "g");
      const matchResult = node.textContent.match(textNodeRegex);

      if (matchResult && matchResult.length > 0) {
        const modelReference = matchResult[0];
        if (!limboNodes[modelReference]) {
          limboNodes[modelReference] = [];
        }
        limboNodes[modelReference].push(
          new LimboNode({
            node,
            modelReferenceInView: modelReference,
            isTextNode: true,
          }),
        );
      }
    }
    currentNode = treeWalker.nextNode();
  }

  return limboNodes;
};
