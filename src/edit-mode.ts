declare module "codemirror" {
  interface LineHandle {
    text: string;
    styleClasses: { textClass: string };
    lineNo(): number;
    styles: any[];
  }
}

export async function onRenderLine(cm: CodeMirror.Editor, line: CodeMirror.LineHandle, el: HTMLElement) {
  // setTimeout here since the renderLine event is emitted before the element is added to the DOM
  // if we don't wait, we won't know who our parent is
  await wait(0);
  let parentElement = el.parentElement;
  if (!parentElement) return; // we can't do anything with a parentless element

  // for some reason, codemirror or hmd skips putting elements in a wrapping div
  // unsure what causes this to happen but try and account for it by falling back
  // if the parent is the root codemirror-code element
  if (parentElement.className === "CodeMirror-code") parentElement = el;

  // clear existing data keys
  clearDataKeys(parentElement.dataset)

  // split child classes
  let childClasses = line.styleClasses?.textClass?.split(" ");

  // line.styles is an array of multi-class strings
  // we combine all of the styles into a single string and then dedupe it
  let childElementClasses = line.styles
    ?.filter((style: string | number) => typeof style === "string")
    .join(" ")
    .split(" ")
    .filter((v, i, a) => a.indexOf(v) === i);

  // look for anything labeled as a header
  // extract its full text value (minus the initial hash)
  if (childClasses?.includes("HyperMD-header")) {
    parentElement.dataset["heading"] = line.text.match(/^[#]+[\s]+(.+)/)[1].trim();
  }

  // check line for any hashtags and add them to a new data key
  const tokens = cm.getLineTokens(line.lineNo())
  const parsedTokens = parseLineTokens(tokens)
  if (parsedTokens) parentElement.dataset["hashtags"] = parseLineTokens(tokens)

  // infer html tag type based on style classes
  let htmlTag = childElementClasses ? lookupTag(childElementClasses) : null
  if (htmlTag) {
    parentElement.dataset["tagName"] = htmlTag;
  }
}


function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function clearDataKeys(keys: DOMStringMap) {
      if (keys) {
          Object.keys(keys).forEach(dataKey => {
            delete keys[dataKey];
          });
        }
  }
  
  function parseLineTokens(tokens: any[]) {
      tokens = tokens.filter((token: { type: string | string[] }) => token.type?.includes("hashtag-end"));
      if (tokens.length) {
        let hashtags = tokens.map((token: { string: any }) => token.string).join(" ");
        if (hashtags.length) {
          return tokens.map((token: { string: any }) => token.string).join(" ");
        }
      }
  }
  
  function lookupTag(classes: string[]) {
      let htmlTag;
      for (const className of classes) {
        switch (className) {
          case "formatting-list-ol":
            htmlTag = "ol";
            break;
          case "formatting-list-ul":
            htmlTag = "ul";
            break;
          case "header-1":
            htmlTag = "h1";
            break;
          case "header-2":
            htmlTag = "h2";
            break;
          case "header-3":
            htmlTag = "h3";
            break;
          case "header-4":
            htmlTag = "h4";
            break;
          case "header-5":
            htmlTag = "h5";
            break;
          case "header-6":
            htmlTag = "h6";
            break;
          case "hmd-codeblock":
            htmlTag = "code";
            break;
          case "hmd-frontmatter":
            htmlTag = "frontmatter";
            break;
        }
      }
      return htmlTag
  }