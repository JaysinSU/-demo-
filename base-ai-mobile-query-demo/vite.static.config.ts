import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const projectRoot = resolve(import.meta.dirname);
const outputRoot = resolve(projectRoot, "static-dist");

function inlineStaticAssets(): Plugin {
  return {
    name: "inline-static-assets",
    apply: "build",
    async closeBundle() {
      const indexPath = resolve(outputRoot, "index.html");
      let html = await readFile(indexPath, "utf8");
      const stylesheet = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
      const script = html.match(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/);

      if (!stylesheet || !script) {
        throw new Error("Unable to locate the generated static assets");
      }

      const cssPath = resolve(outputRoot, stylesheet[1].replace(/^\.\//, ""));
      const scriptPath = resolve(outputRoot, script[1].replace(/^\.\//, ""));
      const [css, javascript] = await Promise.all([
        readFile(cssPath, "utf8"),
        readFile(scriptPath, "utf8"),
      ]);

      html = html
        .replace(stylesheet[0], () => `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`)
        .replace(script[0], () => `<script type="module">${javascript.replace(/<\/script/gi, "<\\/script")}</script>`);

      await writeFile(indexPath, html);
      await rm(resolve(outputRoot, "assets"), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  root: resolve(projectRoot, "static"),
  base: "./",
  publicDir: false,
  plugins: [react(), inlineStaticAssets()],
  build: {
    outDir: outputRoot,
    emptyOutDir: true,
    cssCodeSplit: false,
    target: "es2020",
  },
});
