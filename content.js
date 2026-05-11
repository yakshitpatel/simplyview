/* SimplyView — content script
   Detects supported file types on drive.google.com/file/d/*, injects a
   floating View button, fetches the file via the background worker,
   dispatches to the appropriate renderer in renderers.js, and shows the
   result in a sandboxed iframe overlay. */

(() => {
  const BTN_ID = "drive-render-btn";
  const OVERLAY_ID = "drive-render-overlay";
  const STYLE_ID = "drive-render-styles";

  const ICON_URL = chrome.runtime.getURL("icon-48.png");

  const FILE_EXT_RX = /\.[a-z0-9]{1,8}$/i;

  /** Find the Drive preview iframe (present when a file is open in a modal
   *  on /drive/u/0/folders/... — the URL doesn't change in that mode). */
  const findPreviewIframe = () => {
    for (const f of document.querySelectorAll("iframe")) {
      if (/\/file\/d\//.test(f.src || "")) return f;
    }
    return null;
  };

  const getFileId = () => {
    // Standalone view: /file/d/<id>/view
    const m = location.pathname.match(/\/file\/d\/([^/]+)/);
    if (m) return m[1];
    // Modal preview: extract from the embedded iframe src
    const f = findPreviewIframe();
    const fm = f && (f.src || "").match(/\/file\/d\/([^/?]+)/);
    return fm ? fm[1] : null;
  };

  const getFileName = () => {
    // Standalone view: <title> is "filename.ext - Google Drive"
    const t = (document.title || "").replace(/ - Google Drive$/, "").trim();
    if (t && FILE_EXT_RX.test(t)) return t;

    // Modal preview — Drive sets the iframe's title attribute to the filename
    // for accessibility. This is the most reliable signal.
    const f = findPreviewIframe();
    if (f && f.title && FILE_EXT_RX.test(f.title)) return f.title;

    // Fallback selectors used by Drive's preview modal across versions.
    const sels = [
      'div[role="dialog"] [aria-label]',
      "[data-tooltip][aria-label]",
      '[aria-label][role="presentation"]',
    ];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const text = (
          el.getAttribute("aria-label") ||
          el.textContent ||
          ""
        ).trim();
        if (text && FILE_EXT_RX.test(text) && text.length < 200) return text;
      }
    }

    return null;
  };

  const getTypeInfo = () => {
    const name = getFileName();
    if (!name) return null;
    return window.SimplyView?.detectType(name);
  };

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
/* shadcn-inspired minimal palette
   primary  : #005FFE  (used sparingly — button bg, pill, focus)
   bg       : #ffffff
   fg       : #09090b  (zinc-950)
   muted    : #f4f4f5  (zinc-100)
   muted-fg : #71717a  (zinc-500)
   border   : #e4e4e7  (zinc-200) */

#${BTN_ID} {
  position: fixed;
  top: 78px;
  right: 24px;
  z-index: 2147483645;
  display: inline-flex; align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 10px;
  border: 1px solid #005FFE;
  border-radius: 8px;
  font: 500 13px/1 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  letter-spacing: -0.005em;
  color: #ffffff;
  background: #005FFE;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 95, 254, .18);
  transition: background .14s ease, box-shadow .14s ease, transform .14s ease;
}
#${BTN_ID}:hover {
  background: #0050D6;
  border-color: #0050D6;
  box-shadow: 0 1px 3px rgba(0, 95, 254, .28);
}
#${BTN_ID}:active { transform: translateY(0.5px); }
#${BTN_ID}:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #005FFE;
}
#${BTN_ID}:disabled { opacity: .75; cursor: progress; }
#${BTN_ID} .dr-ic {
  width: 16px; height: 16px; border-radius: 4px;
  background: url("${ICON_URL}") center/cover no-repeat;
}
#${BTN_ID} .dr-sp {
  width: 12px; height: 12px; border-radius: 50%;
  border: 1.6px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  animation: dr-spin .7s linear infinite;
  margin: 2px;
}
@keyframes dr-spin { to { transform: rotate(360deg); } }

#${OVERLAY_ID} {
  position: fixed; inset: 0; z-index: 2147483646;
  background: rgba(9, 9, 11, 0.62);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; flex-direction: column;
  padding: 24px;
  animation: dr-fade .14s ease-out;
  font: 14px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}
@keyframes dr-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dr-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform:none; } }

#${OVERLAY_ID} .dr-frame-wrap {
  flex: 1;
  display: flex; flex-direction: column;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.4);
  animation: dr-rise .22s cubic-bezier(.16,1,.3,1);
}
#${OVERLAY_ID} .dr-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px 10px 14px;
  background: #ffffff;
  border-bottom: 1px solid #e4e4e7;
  color: #09090b;
}
#${OVERLAY_ID} .dr-bar .dr-meta {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 10px;
}
#${OVERLAY_ID} .dr-bar .dr-pill {
  display: inline-flex; align-items: center; flex-shrink: 0;
  font: 600 10.5px/1 ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: .02em;
  padding: 3px 7px; border-radius: 4px;
  background: #005FFE;
  color: #ffffff;
}
#${OVERLAY_ID} .dr-bar .dr-title {
  min-width: 0; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: #09090b;
  font: 500 13px/1.2 ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.005em;
}
#${OVERLAY_ID} .dr-actions { display: flex; gap: 2px; }
#${OVERLAY_ID} .dr-actions button {
  border: 0; background: transparent;
  width: 30px; height: 30px; border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: #71717a;
  transition: background .12s ease, color .12s ease;
}
#${OVERLAY_ID} .dr-actions button:hover { background: #f4f4f5; color: #09090b; }
#${OVERLAY_ID} .dr-actions button:focus-visible {
  outline: none; box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #005FFE;
}
#${OVERLAY_ID} .dr-actions button svg { width: 15px; height: 15px; display: block; }

#${OVERLAY_ID} iframe {
  flex: 1; width: 100%; border: 0; background: #ffffff;
}

#${OVERLAY_ID} .dr-foot {
  margin-top: 14px;
  display: flex; justify-content: space-between; align-items: center;
  font: 500 11.5px/1 ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif;
  color: rgba(255,255,255,0.55);
  padding: 0 4px;
  letter-spacing: -0.002em;
}
#${OVERLAY_ID} .dr-foot kbd {
  font: 600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px; padding: 2px 6px; color: rgba(255,255,255,0.85);
  margin: 0 2px;
}
#${OVERLAY_ID} .dr-foot .dr-brand { display:inline-flex; align-items:center; gap:7px; }
#${OVERLAY_ID} .dr-foot .dr-brand .dot {
  width:7px;height:7px;border-radius:2px;
  background: #005FFE;
}
`;
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = css;
    document.documentElement.appendChild(tag);
  };

  const fetchFile = (fileId) =>
    new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "fetchDriveFile", fileId },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response) {
            reject(new Error("No response from background worker"));
            return;
          }
          if (response.ok) resolve(response.html);
          else reject(new Error(response.error || "Unknown fetch error"));
        },
      );
    });

  const closeOverlay = () => {
    const el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
    document.documentElement.style.overflow = "";
  };

  const openInNewTab = (payload) => {
    // For HTML pass-through we can serve the user's HTML directly as a blob.
    // For renderer-driven modes (markdown/code/json) there's no static HTML
    // to point to — the renderer builds it on demand — so we skip new-tab.
    if (payload.type !== "html") return;
    const blob = new Blob([payload.raw], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const ICONS = {
    newTab:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
  };

  /**
   * @param {{type: string, raw: string, lang?: string}} payload
   * @param {string} fileName
   * @param {string} label
   *
   * Two iframe strategies:
   *  - HTML pass-through: srcdoc + sandbox (null origin). The user's HTML can
   *    contain anything, so we isolate it.
   *  - Markdown / Code / JSON: load renderer.html from chrome-extension://
   *    origin so its `<script src="vendor/...">` tags bypass Drive's parent
   *    CSP. Content is delivered via postMessage after the page signals ready.
   */
  const showOverlay = (payload, fileName, label) => {
    closeOverlay();
    injectStyles();

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;

    const showNewTab = payload.type === "html";
    overlay.innerHTML = `
      <div class="dr-frame-wrap">
        <div class="dr-bar">
          <div class="dr-meta">
            <span class="dr-pill">${escapeHtml(label || "Preview")}</span>
            <span class="dr-title">${escapeHtml(fileName)}</span>
          </div>
          <div class="dr-actions">
            ${showNewTab ? `<button data-act="newtab" title="Open in new tab" aria-label="Open in new tab">${ICONS.newTab}</button>` : ""}
            <button data-act="close" title="Close (Esc)" aria-label="Close">${ICONS.close}</button>
          </div>
        </div>
        <iframe></iframe>
      </div>
      <div class="dr-foot">
        <span class="dr-brand"><span class="dot"></span> SimplyView</span>
        <span>Press <kbd>Esc</kbd> to close</span>
      </div>
    `;

    const iframe = overlay.querySelector("iframe");

    if (payload.type === "html") {
      // Untrusted user HTML — sandboxed, null origin.
      iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-popups");
      iframe.srcdoc = payload.raw;
    } else {
      // Trusted renderer in the extension origin. No sandbox needed.
      const onMessage = (e) => {
        if (e.source !== iframe.contentWindow) return;
        if (e.data?.app !== "simplyview" || e.data?.type !== "ready") return;
        iframe.contentWindow.postMessage(
          {
            app: "simplyview",
            type: payload.type,
            raw: payload.raw,
            lang: payload.lang,
          },
          "*",
        );
        window.removeEventListener("message", onMessage);
      };
      window.addEventListener("message", onMessage);
      iframe.src = chrome.runtime.getURL("renderer.html");
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });
    overlay.querySelector('[data-act="close"]').onclick = closeOverlay;
    const newTabBtn = overlay.querySelector('[data-act="newtab"]');
    if (newTabBtn) newTabBtn.onclick = () => openInNewTab(payload);

    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";

    const escHandler = (e) => {
      if (e.key === "Escape") {
        closeOverlay();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  };

  const escapeHtml = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  const setBtnLoading = (btn, loading) => {
    const ic = btn.querySelector(".dr-ic, .dr-sp");
    if (ic) ic.className = loading ? "dr-sp" : "dr-ic";
    btn.disabled = loading;
    const label = btn.querySelector("span.dr-label");
    if (label) label.textContent = loading ? "Loading…" : "View";
  };

  // True if the extension was reloaded while this content script is still
  // attached to the page — chrome.runtime APIs throw "Extension context
  // invalidated" until the user reloads the tab.
  const isOrphaned = () => !chrome.runtime?.id;

  const onClick = async (btn) => {
    if (isOrphaned()) {
      alert(
        "SimplyView was updated. Please refresh this Drive tab to keep using it.",
      );
      return;
    }
    const fileId = getFileId();
    const info = getTypeInfo();
    if (!fileId || !info) return;
    setBtnLoading(btn, true);
    try {
      const raw = await fetchFile(fileId);
      showOverlay(
        { type: info.type, raw, lang: info.lang },
        getFileName(),
        info.label,
      );
    } catch (err) {
      console.error("[SimplyView]", err);
      const msg = /context invalidated/i.test(err.message)
        ? "SimplyView was updated. Please refresh this Drive tab."
        : err.message;
      alert(`SimplyView: ${msg}`);
    } finally {
      setBtnLoading(btn, false);
    }
  };

  const injectButton = () => {
    if (document.getElementById(BTN_ID)) return;
    if (!getFileId()) return;
    const info = getTypeInfo();
    if (!info) return;
    injectStyles();

    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.title = `View this ${info.label} file`;
    btn.innerHTML = `<span class="dr-ic"></span><span class="dr-label">View</span>`;
    btn.onclick = () => onClick(btn);
    document.body.appendChild(btn);
  };

  const removeButton = () => {
    const btn = document.getElementById(BTN_ID);
    if (btn) btn.remove();
    closeOverlay();
  };

  let lastUrl = location.href;
  const update = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      removeButton();
    }
    if (getTypeInfo()) injectButton();
    else removeButton();
  };

  // Drive is a single-page app — it updates <title> when the user navigates
  // between files. Observe the title element (event-driven, zero polling).
  const observeTitle = () => {
    const titleEl = document.querySelector("title");
    if (!titleEl) return false;
    new MutationObserver(update).observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return true;
  };

  if (!observeTitle()) {
    // <title> doesn't exist yet at document_idle — wait for it via a one-shot
    // head observer, then attach the real title observer.
    const headObs = new MutationObserver(() => {
      if (observeTitle()) {
        headObs.disconnect();
        update();
      }
    });
    headObs.observe(document.head, { childList: true });
  }

  // Browser back/forward (popstate is reachable from the isolated world).
  window.addEventListener("popstate", update);

  // Modal preview detection — on /drive/u/0/folders/* the URL doesn't change
  // when Drive opens a file. It just adds a preview <iframe> to the DOM.
  // Watch body subtree for iframe-related mutations only (cheap filter).
  let scheduled = false;
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      update();
    }, 150);
  };
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.tagName === "IFRAME" || n.querySelector?.("iframe")) {
          scheduleUpdate();
          return;
        }
      }
      for (const n of m.removedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.tagName === "IFRAME" || n.querySelector?.("iframe")) {
          scheduleUpdate();
          return;
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  update();
})();
