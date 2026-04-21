import { marked, Renderer } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const renderer = new Renderer();

renderer.code = function (code: string, lang?: string) {
  const language = lang || "";
  const displayLang = language || "text";
  const escapedCode = escapeHtml(code);

  if (language === "json" && code.length > 500) {
    const lineCount = code.split("\n").length;
    return `<details class="code-block-collapsible">
      <summary class="code-header"><span class="code-lang">${displayLang}</span><span class="code-lines">${lineCount} lines</span></summary>
      <div class="code-block"><pre><code class="language-${language}">${escapedCode}</code></pre>
      <button class="copy-code-btn" data-code="${escapeAttr(code)}">Copy</button></div>
    </details>`;
  }

  return `<div class="code-block">
    <div class="code-header"><span class="code-lang">${displayLang}</span><button class="copy-code-btn" data-code="${escapeAttr(code)}">Copy</button></div>
    <pre><code class="language-${language}">${escapedCode}</code></pre>
  </div>`;
};

renderer.link = function (href: string, title: string | null | undefined, text: string) {
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
  return `<a href="${escapeAttr(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked.use({ renderer });

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const cache = new Map<string, string>();
const CACHE_MAX = 200;

export function renderMarkdown(text: string): string {
  if (!text) return "";

  const MAX_CHARS = 140_000;
  let content = text;
  if (content.length > MAX_CHARS) {
    content = content.slice(0, MAX_CHARS) + "\n\n---\n*Content truncated*";
  }

  const cached = cache.get(content);
  if (cached) return cached;

  try {
    const raw = marked.parse(content) as string;
    const clean = DOMPurify.sanitize(raw, {
      ADD_ATTR: ["target", "rel", "data-code"],
      ADD_TAGS: ["details", "summary"],
    });

    if (cache.size >= CACHE_MAX) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(content, clean);

    return clean;
  } catch {
    return escapeHtml(content);
  }
}

export function copyCodeToClipboard(code: string) {
  navigator.clipboard.writeText(code).catch(() => {
    const el = document.createElement("textarea");
    el.value = code;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  });
}