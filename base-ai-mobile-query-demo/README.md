# Base AI Mobile Query Demo

An interactive mobile prototype for Base AI, covering target Base selection, query-specific responses, per-Base conversations, and cross-Base history.

## Live Demo

[Open the public interactive demo](https://base-ai-mobile-query-demo.pearceworkmantac.chatgpt.site)

## Included interactions

- Open Base AI from the mobile Home page.
- Select or switch the target Base above the composer.
- Enter queries or use recommended prompts to receive different analysis results.
- Keep active conversations isolated by Base.
- View history across all accessible Bases, with each conversation labeled by its target Base.
- Restore a historical conversation and automatically switch to its bound Base.

## Local development

Requirements: Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Build the deployable site with:

```bash
npm run build
```

The project uses vinext and produces a Cloudflare Worker-compatible build. GitHub hosts the source code; the interactive deployment is linked above.
