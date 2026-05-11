// Service worker — fetches Drive files with elevated privileges
// (content scripts get blocked by CORS when Drive redirects to
// drive.usercontent.google.com).
//
// Drive sometimes returns a "Can't scan this file for viruses" interstitial
// HTML page instead of the file bytes — even for small text files (.py is a
// common trigger). The interstitial contains a <form> with a real confirm
// token and an action URL we have to follow to actually get the file.

/** Parse Drive's virus-scan interstitial HTML and return the URL we should
 *  POST/GET to actually retrieve the file. Returns null if `html` isn't a
 *  virus-scan page. */
const parseVirusScanForm = (html) => {
  if (!html.includes('id="download-form"')) return null;

  // The form action attribute (URL we need to call). HTML-decode &amp; etc.
  const actionMatch = html.match(
    /<form[^>]*id="download-form"[^>]*action="([^"]+)"/i,
  );
  if (!actionMatch) return null;
  const action = actionMatch[1]
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

  // All hidden inputs from inside the form become query params.
  const params = new URLSearchParams();
  const inputRx =
    /<input[^>]*type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"/gi;
  let m;
  while ((m = inputRx.exec(html)) !== null) {
    params.set(m[1], m[2].replace(/&amp;/g, "&"));
  }
  if ([...params.keys()].length === 0) return null;
  return `${action}?${params.toString()}`;
};

const fetchOnce = async (url) => {
  const res = await fetch(url, {
    credentials: "include",
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  }
  return res.text();
};

const fetchDriveFile = async (fileId) => {
  const initialUrls = [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`,
  ];

  let lastErr;
  for (const url of initialUrls) {
    try {
      let body = await fetchOnce(url);

      // First try: did we get the virus-scan interstitial?
      const followUp = parseVirusScanForm(body);
      if (followUp) {
        body = await fetchOnce(followUp);
        // Second try: still the interstitial? Then this endpoint can't help.
        if (parseVirusScanForm(body)) {
          lastErr = new Error("Drive kept returning virus-scan page");
          continue;
        }
      }
      return body;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All fetch URLs failed");
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "fetchDriveFile" || !msg.fileId) return;
  fetchDriveFile(msg.fileId)
    .then((text) => sendResponse({ ok: true, html: text }))
    .catch((err) =>
      sendResponse({ ok: false, error: err.message || String(err) }),
    );
  return true; // keep channel open for async sendResponse
});
