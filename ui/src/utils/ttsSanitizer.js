/**
 * Normalizes Markdown formatting into clean natural-language text for Speech Synthesis.
 * Does NOT modify text used for visual rendering.
 */
export function sanitizeForTTS(text) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // 1. Convert code blocks ```lang ... ``` -> inner text
  cleaned = cleaned.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, '$1');

  // 2. Convert inline code `code` -> code
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // 3. Convert Markdown links [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 4. Remove Headings (# Heading, ## Heading, ### Heading) at line start
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // 5. Remove Blockquotes (> Quote) at line start
  cleaned = cleaned.replace(/^>\s+/gm, '');

  // 6. Remove horizontal rules (---, ***, ___)
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '');

  // 7. Remove Unordered List markers (- Item, * Item, + Item) at line start
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');

  // 8. Remove Ordered List markers (1. Item, 2. Item) at line start
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');

  // 9. Convert bold & italic formatting iteratively to handle nested markers (e.g. **This is *very* useful**)
  let prev;
  do {
    prev = cleaned;
    // Handles ***text***, **text**, *text*, ___text___, __text__, _text_
    cleaned = cleaned.replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2');
  } while (cleaned !== prev);

  // 10. Convert Strikethrough ~~text~~ -> text
  cleaned = cleaned.replace(/~~(.*?)~~/g, '$1');

  // 11. Clean up any remaining isolated markdown bold/italic asterisks, underscores, or backticks
  cleaned = cleaned.replace(/\*\*|\*|__|`/g, '');

  // 12. Normalize whitespace and excessive blank lines
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return cleaned.trim();
}
