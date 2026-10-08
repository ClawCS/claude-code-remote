import { PassThrough } from "node:stream";
import { createElement, Suspense, use, type ReactNode } from "react";
import { renderToPipeableStream } from "react-dom/server";

// Release only after the shell is piped: exercise the real hidden React segment,
// not a hand-written approximation of the renderer's transport protocol.
export function streamReactMarkup(content: ReactNode): Promise<string> {
  let release!: (node: ReactNode) => void;
  const pending = new Promise<ReactNode>(resolve => { release = resolve; });
  function Deferred() { return use(pending); }
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.on("data", chunk => { html += chunk; });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(createElement("main", null,
      createElement(Suspense, { fallback: createElement("p", null, "Loading") }, createElement(Deferred))), {
      onShellReady() { stream.pipe(output); setImmediate(() => release(content)); },
      onError: reject,
    });
  });
}
