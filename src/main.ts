import { MarkdownPostProcessorContext, Plugin } from "obsidian";

function tagNode(node: Node, ctx: MarkdownPostProcessorContext) {
  if (node.nodeType === 3) {
    return;
  }

  const nodeEl = node as HTMLElement;
  const isPrint = nodeEl.hasClass("markdown-preview-view");

  if (
    !isPrint &&
    !nodeEl.dataset.tagName &&
    nodeEl.hasChildNodes() &&
    nodeEl.firstChild.nodeType !== 3
  ) {
    const childEl = node.firstChild as HTMLElement;

    Object.keys(childEl.dataset).forEach(
      (k) => (nodeEl.dataset[k] = childEl.dataset[k])
    );

    nodeEl.findAll("a.tag").forEach((tagEl) => {
      const tag = (tagEl as HTMLAnchorElement).innerText
        .slice(1)
        .replace("/", "");
      nodeEl.addClass(`tag-${tag}`);
    });

    const tagName = childEl.tagName.toLowerCase();

    nodeEl.dataset.tagName = tagName;
    nodeEl.addClass(`el-${tagName}`);
  } else if (isPrint && nodeEl.children.length > 0) {
    const children = nodeEl.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      child.findAll("a.tag").forEach((tagEl) => {
        const tag = (tagEl as HTMLAnchorElement).innerText
          .slice(1)
          .replace("/", "");
        child.addClass(`tag-${tag}`);
      });
    }
  }
}

export default class ContextualTypography extends Plugin {
  onload() {
    this.registerMarkdownPostProcessor(tagNode);
  }
}
