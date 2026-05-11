// Service worker — fetches Drive files with elevated privileges
// (content scripts get blocked by CORS when Drive redirects to drive.usercontent.google.com)

const fetchDriveFile = async (fileId) => {
  const urls = [
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`,
  ];

  let lastErr;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        credentials: "include",
        redirect: "follow",
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} from ${new URL(url).host}`);
        continue;
      }
      const text = await res.text();
      // Drive sometimes returns the virus-scan interstitial HTML instead of the file
      if (
        text.includes('id="download-form"') ||
        text.includes("Google Drive can't scan this file")
      ) {
        lastErr = new Error("Drive returned virus-scan page");
        continue;
      }
      return text;
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
