// Shared read-only HTTP/SSR boundary. Reconstruct only literal React completion
// operations; never run response JavaScript or make hidden containers visible.
import { parse } from "acorn";
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW_TAGS = "script|textarea|style|title|iframe|noscript|xmp|noembed|noframes";
const INERT_TAGS = new Set(RAW_TAGS.split("|"));

export function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, entity => {
    const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const code = entity.slice(2, -1);
    const point = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : parseInt(code, 10);
    return point <= 0x10ffff ? String.fromCodePoint(point) : "\ufffd";
  });
}

function attributes(tag) {
  const result = {};
  const body = tag.replace(/^<\/?[\w:-]+/, "").replace(/\/?\s*>$/, "");
  for (const match of body.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function completionCalls(source) {
  let program;
  try { program = parse(source, {ecmaVersion: "latest", sourceType: "script"}); }
  catch { return []; } // Unknown/malformed scripts never establish visibility.
  const calls = [];
  for (const statement of program.body) {
    const call = statement.type === "ExpressionStatement" ? statement.expression : null;
    if (call?.type !== "CallExpression" || call.optional || call.callee.type !== "Identifier" || call.callee.name !== "$RC" || call.arguments.length !== 2) continue;
    const [boundary, segment] = call.arguments;
    if (boundary.type === "Literal" && segment.type === "Literal" && typeof boundary.value === "string" && typeof segment.value === "string" && /^B:[0-9a-f]+$/.test(boundary.value) && /^S:[0-9a-f]+$/.test(segment.value)) calls.push([boundary.value, segment.value]);
  }
  return calls;
}

export function renderedTree(html) {
  const root = { tag: "#document", children: [], parent: null, attrs: {}, opening: "", closing: "" };
  const stack = [root], byId = new Map(), replacements = [];
  const pattern = new RegExp(`<(${RAW_TAGS})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>|<plaintext\\b[\\s\\S]*$|<!--[\\s\\S]*?-->|<![^>]*>|<\\/?[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>|[^<]+|<`, "gi");
  let position = 0;
  for (const token of html.match(pattern) ?? []) {
    position++;
    const parent = stack.at(-1);
    if (token.startsWith("<!--")) { parent.children.push({tag:"#comment",value:token.slice(4,-3),parent,children:[],attrs:{}}); continue; }
    if (!token.startsWith("<")) { parent.children.push({tag:"#text",value:token,parent,children:[],attrs:{}}); continue; }
    if (token.startsWith("<!")) continue;
    const close = token.match(/^<\/([\w:-]+)/);
    if (close) {
      const index = stack.findLastIndex(node => node.tag === close[1].toLowerCase());
      if (index > 0) { stack[index].closing = token; stack.length = index; }
      continue;
    }
    const opening = token.match(/^<([\w:-]+)\b(?:"[^"]*"|'[^']*'|[^'">])*>/);
    if (!opening) continue;
    const tag = opening[1].toLowerCase();
    const node = {tag,attrs:attributes(opening[0]),children:[],parent,opening:opening[0],closing:"",position};
    parent.children.push(node);
    const inertTemplate = stack.some(ancestor => ancestor.tag === "template");
    if (node.attrs.id && !inertTemplate) byId.set(node.attrs.id, byId.has(node.attrs.id) ? null : node);
    if (tag === "script" && !inertTemplate && !Object.hasOwn(node.attrs, "src") && !Object.hasOwn(node.attrs, "nomodule") && (!node.attrs.type || /^(?:text|application)\/javascript$/.test(node.attrs.type))) {
      const body = token.slice(opening[0].length).replace(/<\/script\s*>$/i, "");
      for (const [boundary, segment] of completionCalls(body)) replacements.push([boundary, segment, position]);
    }
    if (!INERT_TAGS.has(tag) && tag !== "plaintext" && !VOID_TAGS.has(tag) && !opening[0].endsWith("/>")) stack.push(node);
  }
  for (const [boundaryId, segmentId, callPosition] of replacements) {
    const boundary = byId.get(boundaryId), segment = byId.get(segmentId);
    if (boundary?.tag !== "template" || segment?.tag !== "div" || !Object.hasOwn(segment.attrs, "hidden") || !boundary.parent || !segment.parent?.children.includes(segment) || boundary.position >= callPosition || segment.position >= callPosition) continue;
    const siblings = boundary.parent.children;
    const boundaryIndex = siblings.indexOf(boundary), start = boundaryIndex - 1;
    if (boundaryIndex < 1 || siblings[start].tag !== "#comment" || siblings[start].value !== "$?") continue;
    let end = boundaryIndex + 1, nesting = 0;
    for (; end < siblings.length; end++) {
      const sibling = siblings[end];
      if (sibling.tag !== "#comment") continue;
      if (/^\$[?!]?$/.test(sibling.value)) nesting++;
      if (sibling.value === "/$") { if (nesting === 0) break; nesting--; }
    }
    if (end === siblings.length) continue;
    // Moving a segment into itself/its descendants is not a valid completion.
    let ancestor = boundary.parent;
    while (ancestor && ancestor !== segment) ancestor = ancestor.parent;
    if (ancestor) continue;
    for (const child of segment.children) child.parent = boundary.parent;
    siblings.splice(start, end - start + 1, ...segment.children);
    segment.children = [];
    segment.parent.children = segment.parent.children.filter(child => child !== segment);
  }
  return root;
}

export function walk(root, callback, hidden = false, ancestors = []) {
  const unavailable = hidden || root.tag === "template" || Object.hasOwn(root.attrs, "hidden") || root.attrs["aria-hidden"] === "true";
  if (!unavailable && root.tag !== "#comment") callback(root, ancestors);
  if (INERT_TAGS.has(root.tag) || root.tag === "template" || root.tag === "plaintext") return;
  for (const child of root.children) walk(child, callback, unavailable, [...ancestors, root.tag]);
}

/** @param {string} html @returns {string} */
export function visibleRenderedMarkup(html) {
  function serialize(node) {
    if (node.tag === "#comment" || INERT_TAGS.has(node.tag) || node.tag === "plaintext" || node.tag === "template" || Object.hasOwn(node.attrs,"hidden") || node.attrs["aria-hidden"] === "true") return "";
    if (node.tag === "#text") return node.value;
    return node.opening + node.children.map(serialize).join("") + node.closing;
  }
  return serialize(renderedTree(html));
}
