# SimplyView

Render HTML, Markdown, JSON & 30+ programming languages inline — actually view your files instead of staring at source code.

Drive (and other tools we plan to support) show your `.html`, `.md`, `.json`, `.py`, `.ts`, `.sql`, `.yaml`, etc. as plain source. This Chrome extension adds a **View** button that opens the file properly rendered in a sandboxed iframe overlay.

## Supported file types (v1.0)

| Category     | Extensions                                                                                                                                                                                                                           | What you get                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **HTML**     | `.html` `.htm`                                                                                                                                                                                                                       | Full live render                                                               |
| **Markdown** | `.md` `.markdown` `.mdx`                                                                                                                                                                                                             | GFM render, syntax-highlighted code blocks, task lists                         |
| **JSON**     | `.json` `.geojson`                                                                                                                                                                                                                   | Collapsible tree, key/value search, expand/collapse all, copy formatted        |
| **Code**     | `.js` `.ts` `.jsx` `.tsx` `.py` `.rb` `.go` `.rs` `.java` `.kt` `.swift` `.cs` `.c` `.cpp` `.php` `.css` `.scss` `.yaml` `.toml` `.sql` `.sh` `.bash` `.xml` `.diff` `.lua` `.r` `.scala` `.pl` `.dart` `.graphql` `.proto` and more | Syntax highlighting (GitHub theme, auto light/dark), line numbers, copy button |

## How it works

1. Content script detects supported file types on `drive.google.com/file/d/*/view`
2. Background service worker fetches the file with your existing Drive session cookies
3. `renderers.js` builds a complete HTML document (with vendor scripts inlined) for the detected type
4. Result is loaded into a sandboxed `<iframe srcdoc>` inside an overlay

No data ever leaves your browser — fetch goes Drive → service worker → sandboxed iframe.

## Install (unpacked)

1. `chrome://extensions`
2. Toggle **Developer mode** (top-right)
3. **Load unpacked** → select this folder
4. Refresh any Drive tab — open a supported file and click **Render**

## Files

```
manifest.json     MV3 manifest
background.js     Service worker — fetches Drive files
content.js        Injects button + overlay, dispatches to renderer
renderers.js      Per-type renderers (HTML / Markdown / JSON / Code)
vendor/           markdown-it, highlight.js, GitHub themes
icon-{16,32,48,128}.png   Generated extension icons
build_icons.py    Run once to regenerate icons (requires Pillow)
```

## Roadmap

- v1.1: SVG, CSV/TSV (sortable table), Mermaid diagrams
- v1.2: Options page — auto-render by type, theme override, font size
- v1.3: Side-by-side source/rendered view, export rendered to PDF/PNG
