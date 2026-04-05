import { marked } from "marked";
import DOMPurify from "dompurify";

// Configure marked with GFM and breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Custom renderer for code blocks
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang || "";
  const displayLang = language || "text";
  const escapedCode = escapeHtml(text);

  // For JSON, auto-collapse if large
  if (language === "json" && text.length > 500) {
    const lineCount = text.split("\n").length;
    return `<details class="code-block-collapsible">
      <summary class="code-header"><span class="code-lang">${displayLang}</span><span class="code-lines">${lineCount} lines</span></summary>
      <div class="code-block"><pre><code class="language-${language}">${escapedCode}</code></pre>
      <button class="copy-code-btn" data-code="${escapeAttr(text)}">Copy</button></div>
    </details>`;
  }

  return `<div class="code-block">
    <div class="code-header"><span class="code-lang">${displayLang}</span><button class="copy-code-btn" data-code="${escapeAttr(text)}">Copy</button></div>
    <pre><code class="language-${language}">${escapedCode}</code></pre>
  </div>`;
};

renderer.link = function ({
  href,
  title,
  text,
}: {
  href: string;
  title?: string | null;
  text: string;
}) {
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
  return `<a href="${escapeAttr(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked.use({ renderer });

// Simple HTML escape
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

// LRU cache for parsed markdown
const cache = new Map<string, string>();
const CACHE_MAX = 200;

export function renderMarkdown(text: string): string {
  if (!text) return "";

  // Truncate very long content
  const MAX_CHARS = 140_000;
  let content = text;
  if (content.length > MAX_CHARS) {
    content = content.slice(0, MAX_CHARS) + "\n\n---\n*Content truncated*";
  }

  // Check cache
  const cached = cache.get(content);
  if (cached) return cached;

  try {
    const raw = marked.parse(content) as string;
    const clean = DOMPurify.sanitize(raw, {
      ADD_ATTR: ["target", "rel", "data-code"],
      ADD_TAGS: ["details", "summary"],
    });

    // Manage cache size
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
    // Fallback for older browsers
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
