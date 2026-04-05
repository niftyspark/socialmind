import type { ChatSession } from "../types/chat";

export function exportChatAsMarkdown(session: ChatSession): void {
  const lines: string[] = [];
  lines.push(`# ${session.title}`);
  lines.push(`*Exported on ${new Date().toLocaleString()}*`);
  lines.push(`*Model: ${session.model}*`);
  lines.push("");

  for (const msg of session.messages) {
    const role = msg.role === "user" ? "You" : msg.role === "assistant" ? "Assistant" : "System";
    const time = new Date(msg.timestamp).toLocaleTimeString();
    lines.push(`## ${role} (${time})`);
    lines.push("");
    lines.push(msg.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copySessionAsText(session: ChatSession): void {
  const lines: string[] = [];
  for (const msg of session.messages) {
    const role = msg.role === "user" ? "You" : msg.role === "assistant" ? "Assistant" : "System";
    lines.push(`${role}: ${msg.content}`);
    lines.push("");
  }
  navigator.clipboard.writeText(lines.join("\n")).catch(() => {});
}
