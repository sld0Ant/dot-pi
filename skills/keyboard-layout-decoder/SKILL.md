---
name: keyboard-layout-decoder
description: Decode text typed with wrong keyboard layout. Converts between Russian and English (ЙЦУКЕН/QWERTY). Use when text looks garbled or user mentions wrong layout.
---

# Keyboard Layout Decoder

Decode text that was typed with the wrong keyboard layout active.

## When to Use

- User says they typed with wrong layout
- Text looks like gibberish but has a pattern (e.g., `ghbdtn` instead of `привет`)
- Mix of characters that doesn't make sense

## Instructions

Run the decoder script:

```bash
bun ./decoder.ts "text to decode"
```

The script auto-detects direction and converts between Russian ↔ English.

## Examples

| Input (wrong layout) | Output (correct) |
| -------------------- | ---------------- |
| `ghbdtn`             | `привет`         |
| `ьфсищщл`            | `macbook`        |
| `ghjuhfvvbcn`        | `программист`    |
| `ру\|дщ цщкдв`       | `hello world`    |
