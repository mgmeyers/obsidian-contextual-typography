import { MarkdownPostProcessorContext, Plugin } from "obsidian";

const imageExt = ["bmp", "png", "jpg", "jpeg", "gif", "svg", "webp"];
const audioExt = ["mp3", "wav", "m4a", "3gp", "flac", "ogg", "oga"];
const videoExt = ["mp4", "webm", "ogv"];

function isInternalEmbed(node: HTMLElement) {
  if (node.nodeType === 3) {
    return false;
  }

  const child = node.firstChild as HTMLElement;

  return child && child.classList?.contains("internal-embed");
}

function getEmbedType(node: HTMLElement) {
  if (node.nodeType === 3) {
    return null;
  }

  const child = node.firstChild as HTMLElement;
  const src = child.getAttr("src");

  if (!src) {
    return null;
  }

  const ext = src.split(".").pop()?.toLowerCase();

  if (imageExt.contains(ext)) return "image";
  if (audioExt.contains(ext)) return "audio";
  if (videoExt.contains(ext)) return "video";
  if (/#\^[^\^]+$/.test(src)) return "block";
  if (/#[^#]+$/.test(src)) return "heading";

  return "page";
}

function isExternalImageEmbed(node: HTMLElement) {
  if (node.nodeType === 3) {
    return false;
  }

  const child = node.firstChild as HTMLElement;
  return child && child.tagName?.toLowerCase() === "img";
}

function getBlockLanguage(node: HTMLElement) {
  if (node.nodeType === 3) {
    return null;
  }

  let lang: null | string = null;

  node.classList.forEach((cls) => {
    if (cls.startsWith("block-language")) {
      lang = cls.replace(/^block\-language\-/, "");
    }
  });

  return lang;
}

function fixMarkdownLinkEmbeds(node: HTMLElement) {
  if (node.children.length <= 1) {
    return;
  }

  let containsNakedEmbed = false;
  let childNodes: ChildNode[] = [];

  node.childNodes.forEach((n) => {
    if (n.nodeValue === "\n") return;

    switch (n.nodeName) {
      case "P": {
        if ((n as HTMLElement).children.length === 0) {
          return;
        } else {
          n.childNodes.forEach((pn) => {
            if (pn.nodeName !== "BR" && pn.nodeValue !== "\n")
              childNodes.push(pn);
          });
          return;
        }
      }
      case "BR": {
        return;
      }
    }

    if (
      n.nodeType === 1 &&
      (n as HTMLElement).classList?.contains("internal-embed")
    ) {
      containsNakedEmbed = true;
    }

    childNodes.push(n);
  });

  if (!containsNakedEmbed) return;

  node.empty();
  node.createEl("p", {}, (p) => {
    childNodes.forEach((c, i, arr) => {
      p.append(c);

      const nodeIsEmbed =
        c.nodeType === 1 &&
        !!(c as HTMLElement).getAttribute("src") &&
        i < arr.length - 1;

      const nodeIsTextFollowedByEmbed =
        c.nodeType === 3 &&
        arr[i + 1]?.nodeType === 1 &&
        !!(arr[i + 1] as HTMLElement).getAttribute("src");

      if (nodeIsEmbed || nodeIsTextFollowedByEmbed) {
        p.createEl("br");
      }
    });
  });
}

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
    fixMarkdownLinkEmbeds(nodeEl);

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

    let tagName = childEl.tagName.toLowerCase();

    if (isExternalImageEmbed(childEl)) {
      nodeEl.dataset.isEmbed = "true";
      nodeEl.dataset.embedType = "image";
      nodeEl.addClass(`el-embed-image`);
    } else if (isInternalEmbed(childEl)) {
      const embedType = getEmbedType(childEl);
      nodeEl.dataset.isEmbed = "true";
      nodeEl.dataset.embedType = embedType;
      nodeEl.addClass(`el-embed-${embedType}`);
    } else {
      const blockLang = getBlockLanguage(childEl);

      if (blockLang) {
        nodeEl.dataset.blockLanguage = blockLang;
        nodeEl.addClass(`el-lang-${blockLang}`);
      }
    }

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
    document.body.classList.add("contextual-typography");
    this.registerMarkdownPostProcessor(tagNode);
  }

  unload() {
    document.body.classList.remove("contextual-typography");
  }
}
