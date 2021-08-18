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

    Object.keys(childEl.dataset).forEach(
      (k) => (nodeEl.dataset[k] = childEl.dataset[k])
    );

    nodeEl.findAll('a.tag').forEach(tagEl => {
      const tag = (tagEl as HTMLAnchorElement).innerText.slice(1).replace('/', '');
      nodeEl.addClass(`tag-${tag}`);
    })

    nodeEl.dataset.tagName = childEl.tagName.toLowerCase();
  }
}

export default class ContextualTypography extends Plugin {
  onload() {
    this.registerMarkdownPostProcessor(tagNode);
  }
}
