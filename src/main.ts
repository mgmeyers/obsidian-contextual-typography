import { Plugin } from "obsidian";

function tagNode(node: Node) {
  if (node.nodeType === 3) {
    return;
  }

  const nodeEl = node as HTMLElement;

  if (
    !nodeEl.dataset.tagName &&
    nodeEl.hasChildNodes() &&
    nodeEl.firstChild.nodeType !== 3
  ) {
    const childEl = node.firstChild as HTMLElement;
    nodeEl.dataset.tagName = childEl.tagName.toLowerCase();
  }
}

export default class ContextualTypography extends Plugin {
  onload() {
    this.registerMarkdownPostProcessor(tagNode)
  }
}
