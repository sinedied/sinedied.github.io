---
title: Hello world — first blog post
published: false
description: 'Welcome to my blog! This is a test post to verify the blog setup with GFM markdown and syntax highlighting.'
tags: 'webdev, meta, test'
cover_image: ''
date: '2026-02-26T10:00:00Z'
slug: test
---

Welcome to my new blog! This is a sample post to verify everything works. Check out the [Astro documentation](https://docs.astro.build) or visit [GitHub](https://github.com) for more info.

## Text Formatting

Here's some **bold text**, some *italic text*, and some ***bold italic*** text. You can also use ~~strikethrough~~ for deleted content.

This sentence has `inline code` and also a longer inline snippet like `const x = 42;` embedded in it.

## Headings

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

## Lists

### Unordered Lists

- First item
- Second item with a longer description that might wrap to the next line on smaller screens
- Third item
  - Nested item A
  - Nested item B
    - Deeply nested item

### Ordered Lists

1. First step
2. Second step
3. Third step
   1. Sub-step A
   2. Sub-step B

### Task Lists

- [x] Set up blog section
- [x] Add RSS feed
- [ ] Write more posts

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Markdown | ✅ | Full support |
| GFM | ✅ | Tables, task lists, strikethrough |
| Syntax highlighting | ✅ | Shiki with github-dark-default |
| RSS feed | ✅ | Available at `/rss.xml` |

## Code Highlighting

```typescript
interface BlogPost {
  title: string;
  published: boolean;
  date: Date;
}

function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet('world'));
```

```bash
npm run dev
```

## Blockquote

> The best way to predict the future is to invent it.
> — Alan Kay

## Images

### Image without caption

![Placeholder image](https://picsum.photos/800/400)

### Image with caption

![A beautiful landscape from Lorem Picsum](https://picsum.photos/800/300)
*A beautiful landscape from Lorem Picsum*

## Emoji

Here are some colorful emoji to test theme filtering: 🚀 🎉 🔥 ⭐ 💎 🌈 🎨 🦀 🐧 🍕 💚 🌍 ☕ 🏆 🤖

## Horizontal Rule

---

That's it for now. More posts coming soon! 🎉
