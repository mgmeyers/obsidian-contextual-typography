import { Plugin, WorkspaceLeaf } from "obsidian";

const config = {
  attributes: false,
  childList: true,
  subtree: false,
};

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
  observers: { [id: string]: MutationObserver } = {};

  disconnectObserver(id: string) {
    if (this.observers[id]) {
      this.observers[id].disconnect();
      delete this.observers[id];
    }
  }

  connectObserver(id: string, leaf: WorkspaceLeaf) {
    if (this.observers[id]) return;

    const previewSection = leaf.view.containerEl.getElementsByClassName(
      "markdown-preview-section"
    );

    if (previewSection.length) {
      this.observers[id] = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach(tagNode);
        });
      });

      this.observers[id].observe(previewSection[0], config);

      setTimeout(() => {
        previewSection[0].childNodes.forEach(tagNode);
      }, 0);
    }
  }

  onunload() {
    Object.keys(this.observers).forEach((k) => this.disconnectObserver(k));
  }

  onload() {
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        const seen: { [k: string]: boolean } = {};

        this.app.workspace.iterateRootLeaves((leaf) => {
          const id = (leaf as any).id as string;
          this.connectObserver(id, leaf);
          seen[id] = true;
        });

        Object.keys(this.observers).forEach((k) => {
          if (!seen[k]) {
            this.disconnectObserver(k);
          }
        });
      })
    );
  }
}
