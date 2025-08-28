// readingTimeEstimator.ts

interface TiptapNode {
  type: string;
  text?: string;
  content?: TiptapNode[];
}

/**
 * Recursively extracts plain text from Tiptap JSON content
 */
function extractText(node: TiptapNode): string {
  let text = '';

  if (node.text) text += node.text + ' ';
  if (node.content) {
    for (const child of node.content) {
      text += extractText(child);
    }
  }

  return text;
}

/**
 * Converts Tiptap JSON content into plain text
 */
export function getPlainText(tiptapContent: TiptapNode): string {
  return extractText(tiptapContent).trim();
}

/**
 * Estimates reading time in minutes
 * @param text Plain text
 * @param wordsPerMinute Default 200 wpm
 * @returns Estimated reading time string, e.g., "3 min read"
 */
export function estimateReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute)); // minimum 1 min
  return minutes;
}

/**
 * Main function: pass Tiptap JSON content and get reading time
 */
export function readingTimeFromTiptap(tiptapContent: TiptapNode, wordsPerMinute = 200): number {
  const text = getPlainText(tiptapContent);
  return estimateReadingTime(text, wordsPerMinute);
}

/* =========================
  Example usage:
========================= */
/*
import { readingTimeFromTiptap } from './readingTimeEstimator';

const tiptapContent = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "This is a test blog content." }] },
    { type: "paragraph", content: [{ type: "text", text: "Another paragraph to read." }] }
  ]
};

console.log(readingTimeFromTiptap(tiptapContent)); // "1 min read"
*/
