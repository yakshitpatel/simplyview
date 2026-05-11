# Chrome Web Store Listing — Copy/Paste Reference

Everything you'll paste into the CWS developer dashboard at
`chrome.google.com/webstore/devconsole`.

---

## Extension name (max 75 chars)

```
SimplyView
```

## Summary (max 132 chars)

```
Actually view your Drive files. Renders HTML, Markdown, JSON, and 30+ programming languages inline — no download needed.
```

## Description (max 16,000 chars)

```
Google Drive shows .md, .json, .py, .ts, .yaml, .sql and dozens of other file types as plain source code. SimplyView fixes that.

Click "View" on any supported file — in the Drive file viewer or right in the folder modal preview — and SimplyView renders it properly:

✦ HTML files — fully rendered, just like opening them in a browser
✦ Markdown — GitHub-flavored render with syntax-highlighted code blocks and task lists
✦ JSON — collapsible tree with search, expand-all, copy formatted
✦ 30+ programming languages — syntax highlighting, line numbers, copy button
  (JS, TS, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C/C++/C#, PHP, CSS,
   YAML, TOML, SQL, Shell, XML, Diff, Lua, R, Scala, Perl, Dart, GraphQL, …)

How it's different
─────────────────────
• Works in the standalone file view AND in Drive's folder modal preview
• No download required — fetches the file with your existing Drive session
• No data leaves your browser — no servers, no analytics, no tracking
• Dark mode that auto-matches your system theme
• Keyboard shortcut: ⌘⇧Y (Mac) or Ctrl⇧Y (Windows/Linux)
• Open standalone for sharing — one click from inside the folder modal

Privacy
─────────────────────
SimplyView has no servers and no analytics. The entire extension runs in your
browser. It fetches files only from drive.google.com using your existing
session cookies — exactly the same authentication Drive itself uses.

Source code is open and auditable at:
github.com/yakshitpatel/simplyview

Privacy policy:
yakshitpatel.com/lab/simplyview/privacy
```

## Category

**Productivity** (primary)

## Language

English (en)

---

## Single-purpose statement (in the "Privacy practices" tab)

> SimplyView renders Google Drive files (HTML, Markdown, JSON, and 30+
> programming languages) inline in the browser so users can view their
> content without downloading. This is the only thing the extension does.

---

## Permission justifications

The dashboard asks you to justify each permission/host you declare. Paste
these into the corresponding fields under **Privacy practices → Permission
justifications**.

### `host_permissions: https://drive.google.com/*`

> Required to inject the View button into the Drive file viewer
> (`/file/d/*/view`) and folder modal preview (`/drive/*/folders/*`),
> and to fetch the user's file content using their existing Drive
> session cookies.

### `host_permissions: https://drive.usercontent.google.com/*`

> Google Drive sometimes serves file downloads from this host as a
> redirect target of `drive.google.com/uc?export=download`. The
> permission is required so the service worker's `fetch()` can follow
> the redirect and retrieve the file bytes.

### Data usage declarations (check the matching boxes)

- **Authentication information** — _In use, not collected_. Reason: the
  extension's fetch uses the browser's existing Drive session cookies
  (credentials: include). No authentication data is stored or transmitted
  anywhere.
- **Website content** — _In use, not collected_. Reason: the extension
  fetches the file the user explicitly invoked View on, renders it in a
  sandboxed iframe, and discards it on close. No content is stored or
  transmitted.

### Limited Use disclosure

Check the box affirming compliance with the **Limited Use** restrictions
of the Chrome Web Store User Data Policy. The text of the policy is at:
https://developer.chrome.com/docs/webstore/program-policies/limited-use

---

## Privacy policy URL

```
https://yakshitpatel.com/lab/simplyview/privacy
```

(Make sure the page is publicly reachable before submitting — Google's
reviewer will fetch it.)

---

## Homepage URL

```
https://yakshitpatel.com/lab/simplyview
```

---

## Support URL

```
https://github.com/yakshitpatel/simplyview/issues
```

(Make the GitHub repo public first if you want this URL, OR just point
support to your email.)

---

## Distribution

- **Visibility:** Public
- **Distribution:** All regions
- **Mature content:** No

---

## Screenshots (1280×800, 1–5 images)

Need at least 1, ideally 3–5. Suggested shots:

1. The "View" pill button visible on a Drive file
2. Rendered Markdown view (light mode) of a sample .md file
3. Rendered Markdown view (dark mode)
4. Rendered JSON tree view with the search box in use
5. Rendered code view (Python or TypeScript) with syntax highlighting

I can capture these with Chrome MCP if you tell me which file in your Drive
to use as the demo subject.
