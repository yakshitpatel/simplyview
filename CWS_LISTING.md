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

> Rewritten 2026-05-12 after first submission was rejected for "excessive
> keywords" (the laundry-list of file extensions tripped a spam filter).
> Keep this version free of `.md / .json / .py / …` enumerations and long
> comma-separated language lists.

```
Google Drive treats most source files as plain text. Open a Markdown file and you see asterisks and dashes. Open a JSON file and you see a wall of escaped strings. Open an HTML file and you see tags rendered as code instead of as a page. SimplyView fixes that.

Click View on any supported file — whether you're in Drive's standalone file viewer or the folder modal preview — and SimplyView renders it the way it should be read:

— HTML pages render exactly as they would in a browser.
— Markdown is presented with GitHub-style typography, syntax-highlighted code blocks, rendered task lists, and proper tables.
— JSON becomes a collapsible tree with search, expand-all, and copy-formatted options.
— Source code in common programming languages is shown with syntax highlighting, line numbers, and a copy button.

What makes SimplyView different

— Works inside Drive's standalone file viewer AND the folder modal preview. Not one or the other.
— Nothing leaves your browser. No servers, no analytics, no tracking. The extension fetches files only through your existing Drive session — the same authentication Drive itself uses.
— Dark mode follows your system theme automatically. The rendered page, the overlay, and the syntax highlighting all swap together.
— A keyboard shortcut opens files without reaching for the mouse.
— A one-click "open standalone" action lets you jump from the folder modal to a dedicated tab when you need to share or screenshot.

Privacy

SimplyView has no servers and collects no data of any kind. The full source code is open and auditable on GitHub. Anyone can read exactly what the extension does, line by line.

Source code: github.com/yakshitpatel/simplyview
Privacy policy: github.com/yakshitpatel/simplyview/blob/main/PRIVACY.md
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
