/**
 * Rehype plugin that wraps Unicode emoji characters in <span class="emoji">
 * so they can be targeted with CSS filters (e.g. green-phosphor theme tinting).
 */
import { visit } from 'unist-util-visit';
import type { Root, Text, Element } from 'hast';

const emojiRegex = /(\p{Extended_Pictographic})/gu;

export default function rehypeEmojiSpan() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      // Skip text inside code/pre elements
      if (parent.type === 'element') {
        const tag = (parent as Element).tagName;
        if (tag === 'code' || tag === 'pre' || tag === 'script' || tag === 'style') return;
      }

      const text = node.value;
      if (!emojiRegex.test(text)) return;
      // Reset regex lastIndex after test
      emojiRegex.lastIndex = 0;

      const children: (Text | Element)[] = [];
      let last = 0;

      for (const m of text.matchAll(emojiRegex)) {
        const start = m.index!;
        if (start > last) {
          children.push({ type: 'text', value: text.slice(last, start) });
        }
        children.push({
          type: 'element',
          tagName: 'span',
          properties: { className: ['emoji'] },
          children: [{ type: 'text', value: m[0] }],
        });
        last = start + m[0].length;
      }

      if (last < text.length) {
        children.push({ type: 'text', value: text.slice(last) });
      }

      // Replace the text node with the new children
      parent.children.splice(index, 1, ...children);
    });
  };
}
