import { LimboNode } from "./LimboNode";

export const generateLimboNodes: (
  modelName: string,
  html: string,
  htmlContainer: HTMLElement,
  modelPrefix?: string,
) => { [key: string]: LimboNode[] } = (modelName, html, htmlContainer, modelPrefix) => {
  const limboNodes: { [key: string]: LimboNode[] } = {};
  const regex = new RegExp(`([a-zA-z-]+)="[^"]*(({{${modelName}\\..+}})|({{${modelName}}}))[^"]*"`, "g");
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
            modelPrefix,
          }),
        );
      }
    }
  }

  const treeWalker = document.createTreeWalker(htmlContainer, NodeFilter.SHOW_TEXT, (node) => {
    const textNodeRegex = new RegExp(`{{${modelName}\\..+}}|{{${modelName}}}`, "g");
    const result = textNodeRegex.test((node as Text).textContent || "");
    return result ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  });

  let currentNode = treeWalker.nextNode();
  while (currentNode) {
    const node = currentNode as Text;

    if (node.textContent) {
      const textNodeRegex = new RegExp(`{{${modelName}\\..+}}|{{${modelName}}}`, "g");
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
            modelPrefix,
          }),
        );
      }
    }
    currentNode = treeWalker.nextNode();
  }

  return limboNodes;
};
