# SimplyView — Privacy Policy

_Last updated: May 12, 2026_

SimplyView is a Chrome extension that renders Google Drive files (HTML,
Markdown, JSON, and 30+ programming languages) inline in your browser so
you can actually view them instead of staring at source code.

## What data we collect

**None.** SimplyView does not collect, transmit, sell, or store any user
data, anywhere.

- We have no servers.
- We have no analytics.
- We have no third-party SDKs.
- We never log, ship, or report any data you view.

## How SimplyView works

When you click the **View** button on a supported Drive file:

1. The extension fetches the file from `drive.google.com` using your
   existing Drive session cookies (the same authentication your browser
   already has).
2. The file content stays in your browser. It is rendered in a sandboxed
   iframe and shown to you in an overlay.
3. The overlay closes when you press Esc or click outside; the content
   is discarded.

No request is made to any server outside of `drive.google.com` and
`drive.usercontent.google.com`. We never see your files.

## Permissions we request

- `host_permissions: https://drive.google.com/*` — to inject the View
  button into Drive's file viewer and folder modal preview.
- `host_permissions: https://drive.usercontent.google.com/*` — Drive
  sometimes redirects file downloads through this host; we follow it so
  the file can be rendered.

These hosts cover the _minimum_ needed for SimplyView to function and
match the single-purpose declaration of the extension.

## Compliance with Chrome Web Store policies

SimplyView's use of Drive data complies with the
[Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq),
including the **Limited Use** requirements:

- We only access the file content you explicitly invoke the extension on.
- We do not use Drive data for advertising or to build user profiles.
- We do not allow humans to read your data, with the narrow standard
  exceptions (your explicit consent, security investigations, or to
  comply with applicable law) — none of which apply because we have no
  servers and never receive your data in the first place.
- We do not transfer your data to third parties for any purpose.

## Open source

The full source code of SimplyView is published at
<https://github.com/yakshitpatel/simplyview>. You can audit exactly what
the extension does, line by line.

## Contact

Questions or reports: **yakshitpatel2109@gmail.com**

If you'd like to report a security issue privately, please email the
same address with `[SECURITY]` in the subject line.
