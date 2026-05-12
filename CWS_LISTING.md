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

> Rewritten 2026-05-12 (v2) after first submission was rejected for
> "excessive keywords" — the .md / .json / .py / .ts / .yaml / .sql list
> and the comma-separated language enumeration tripped Google's spam
> filter. This version uses category words ("Markdown / HTML / JSON /
> source code") instead of file extensions, and follows PrintFriendly's
> narrative structure: hook → who it's for → sectioned features → links.

```
Render Markdown, HTML, JSON, and source code files inline in Google Drive — exactly the way they were meant to be read.

Drive opens most non-Google file formats as plain source. SimplyView is a free Chrome extension that adds a "View" button to Drive's file viewer and folder modal preview, so the file you click actually renders instead of dumping its source at you.

Built for developers, product managers, writers, designers, and anyone whose Drive isn't 100% Google Docs. If you store READMEs, design specs, configs, API responses, or scripts in Drive, SimplyView turns Drive into a viewer you'd actually want to use.

🪄 Real Rendering, Not Source
Markdown shows up as formatted text with proper headings, tables, task lists, and syntax-highlighted code blocks — the same look you'd get on GitHub. HTML pages render the way a browser would render them. JSON becomes a collapsible tree you can search and copy from. Source code files are highlighted with line numbers and a one-click copy button.

🪟 Works Everywhere in Drive
SimplyView shows up in two places most preview extensions miss. The standalone file viewer (where you land when you open a Drive link) AND the modal preview that opens when you double-click a file inside a folder. Navigate between files inside the modal and SimplyView keeps up.

🌙 Built-In Dark Mode
The viewer follows your system theme automatically. Rendered content, the overlay, and syntax highlighting all swap together — no flash of light, no manual toggle.

⌨️ Keyboard-First
Press Cmd+Shift+Y on Mac or Ctrl+Shift+Y on Windows and Linux to open the current file without reaching for the mouse. Press Esc to close.

🔒 Nothing Leaves Your Browser
SimplyView has no servers, no analytics, no tracking, no third-party SDKs. It fetches files only from Google Drive, using the session your browser is already signed into. The full source code is published on GitHub — you can audit exactly what runs inside the extension.

Get back the hour a week you spend squinting at raw source code in Drive.

📃 Privacy Policy: https://github.com/yakshitpatel/simplyview/blob/main/PRIVACY.md
🛠 Source Code: https://github.com/yakshitpatel/simplyview
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
