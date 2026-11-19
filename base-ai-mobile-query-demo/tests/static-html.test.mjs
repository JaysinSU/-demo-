import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../static-dist/", import.meta.url);

test("builds a self-contained GitHub Pages demo", async () => {
  const files = await readdir(outputRoot);
  const html = await readFile(new URL("index.html", outputRoot), "utf8");
  const documentMarkup = html.slice(0, html.indexOf('<script type="module">'));

  assert.deepEqual(files, ["index.html"]);
  assert.match(html, /<title>Base AI Mobile Demo<\/title>/);
  assert.match(html, /className:\s*["`]device-shell["`]/);
  assert.match(html, /--device-scale/);
  assert.match(html, /transform:scale\(var\(--device-scale/);
  assert.match(html, /<style>/);
  assert.match(html, /<script type="module">/);
  assert.doesNotMatch(html, /chatgpt\.site/i);
  assert.doesNotMatch(documentMarkup, /http-equiv=["']refresh/i);
  assert.doesNotMatch(html, /(?:src|href)=["']\.\/assets\//i);
});
