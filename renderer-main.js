/* SimplyView — renderer page logic.
   Runs inside renderer.html, which is loaded as the iframe source from the
   chrome-extension:// origin. Receives the file content from the parent
   content script via postMessage and renders into #content. */

(() => {
  const content = document.getElementById("content");

  const esc = (s) =>
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

  const showError = (msg) => {
    content.classList.remove("loading");
    content.innerHTML = `<div class="error"><b>SimplyView render error</b><br><br>${esc(msg)}</div>`;
  };

  // ───────────── Markdown ─────────────
  const renderMarkdown = (raw) => {
    if (typeof window.markdownit !== "function") {
      throw new Error("markdown-it library failed to load");
    }
    if (typeof window.hljs === "undefined") {
      throw new Error("highlight.js library failed to load");
    }
    const md = window.markdownit({
      html: false,
      linkify: true,
      typographer: true,
      breaks: false,
      highlight: (str, lang) => {
        if (lang && window.hljs.getLanguage(lang)) {
          try {
            return window.hljs.highlight(str, { language: lang }).value;
          } catch {}
        }
        try {
          return window.hljs.highlightAuto(str).value;
        } catch {}
        return "";
      },
    });
    content.innerHTML = md.render(raw);

    // GFM-style task list checkboxes (markdown-it doesn't do this by default).
    content.querySelectorAll("li").forEach((li) => {
      const m = li.textContent.match(/^\s*\[([ xX])\]\s/);
      if (!m) return;
      li.innerHTML = li.innerHTML.replace(/^\s*\[(.)\]\s/, (_, ch) => {
        return `<input type="checkbox" disabled ${ch.trim() ? "checked" : ""}> `;
      });
    });
  };

  // ───────────── Code ─────────────
  const renderCode = (raw, lang) => {
    if (typeof window.hljs === "undefined") {
      throw new Error("highlight.js library failed to load");
    }
    const langLabel = lang || "plain text";
    content.innerHTML = `
      <div class="toolbar">
        <span class="lang">${esc(langLabel)}</span>
        <button id="dr-copy">Copy</button>
      </div>
      <pre><code id="raw" class="${lang ? "language-" + lang : ""}"></code></pre>
    `;
    const codeEl = content.querySelector("#raw");
    codeEl.textContent = raw;
    try {
      window.hljs.highlightElement(codeEl);
    } catch {}
    // Line numbers
    const lines = codeEl.innerHTML.split("\n");
    codeEl.innerHTML = lines
      .map((l, i) => `<span class="ln">${i + 1}</span>${l}`)
      .join("\n");

    content.querySelector("#dr-copy").onclick = function () {
      navigator.clipboard.writeText(raw).then(() => {
        this.textContent = "Copied";
        setTimeout(() => (this.textContent = "Copy"), 900);
      });
    };
  };

  // ───────────── JSON ─────────────
  const renderJSON = (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error("Invalid JSON: " + e.message);
    }

    let nodes = 0,
      leaves = 0;

    const build = (v, key, isLast) => {
      nodes++;
      const wrap = document.createElement("div");
      wrap.className = "node";
      const head = document.createElement("span");
      const tail = document.createElement("span");
      const ellipsis = document.createElement("span");
      ellipsis.className = "ellipsis";

      const label =
        key !== undefined
          ? `<span class="k">"${esc(key)}"</span><span class="nl">: </span>`
          : "";

      if (Array.isArray(v)) {
        const toggle = document.createElement("span");
        toggle.className = "toggle";
        toggle.textContent = "▾";
        wrap.appendChild(toggle);
        head.innerHTML = label + `<span class="nl">[</span>`;
        ellipsis.innerHTML = `<span class="nl">…${v.length} items…</span>`;
        wrap.appendChild(head);
        wrap.appendChild(ellipsis);
        const children = document.createElement("div");
        children.className = "children";
        v.forEach((item, i) =>
          children.appendChild(build(item, undefined, i === v.length - 1)),
        );
        wrap.appendChild(children);
        tail.innerHTML = `<span class="nl">]${isLast ? "" : ","}</span>`;
        wrap.appendChild(tail);
        toggle.onclick = () => {
          wrap.classList.toggle("collapsed");
          toggle.textContent = wrap.classList.contains("collapsed") ? "▸" : "▾";
        };
      } else if (v && typeof v === "object") {
        const toggle = document.createElement("span");
        toggle.className = "toggle";
        toggle.textContent = "▾";
        wrap.appendChild(toggle);
        head.innerHTML = label + `<span class="nl">{</span>`;
        const keys = Object.keys(v);
        ellipsis.innerHTML = `<span class="nl">…${keys.length} keys…</span>`;
        wrap.appendChild(head);
        wrap.appendChild(ellipsis);
        const children = document.createElement("div");
        children.className = "children";
        keys.forEach((k, i) =>
          children.appendChild(build(v[k], k, i === keys.length - 1)),
        );
        wrap.appendChild(children);
        tail.innerHTML = `<span class="nl">}${isLast ? "" : ","}</span>`;
        wrap.appendChild(tail);
        toggle.onclick = () => {
          wrap.classList.toggle("collapsed");
          toggle.textContent = wrap.classList.contains("collapsed") ? "▸" : "▾";
        };
      } else {
        leaves++;
        let val;
        if (typeof v === "string") val = `<span class="s">"${esc(v)}"</span>`;
        else if (typeof v === "number") val = `<span class="n">${v}</span>`;
        else if (typeof v === "boolean" || v === null)
          val = `<span class="b">${v}</span>`;
        else val = esc(String(v));
        head.innerHTML = `${label}${val}<span class="nl">${isLast ? "" : ","}</span>`;
        wrap.appendChild(head);
      }
      return wrap;
    };

    content.innerHTML = `
      <div class="toolbar">
        <span class="stats" id="dr-stats"></span>
        <input id="dr-q" placeholder="Search keys / values…">
        <button id="dr-expand">Expand all</button>
        <button id="dr-collapse">Collapse all</button>
        <button id="dr-copy">Copy JSON</button>
      </div>
      <div id="dr-root" class="tree"></div>
    `;
    const root = content.querySelector("#dr-root");
    root.appendChild(build(data, undefined, true));
    content.querySelector("#dr-stats").textContent =
      `${nodes} nodes · ${leaves} values`;

    content.querySelector("#dr-expand").onclick = () => {
      root.querySelectorAll(".node.collapsed").forEach((n) => {
        n.classList.remove("collapsed");
        const t = n.querySelector(":scope > .toggle");
        if (t) t.textContent = "▾";
      });
    };
    content.querySelector("#dr-collapse").onclick = () => {
      root.querySelectorAll(".node").forEach((n) => {
        if (n.querySelector(":scope > .children")) {
          n.classList.add("collapsed");
          const t = n.querySelector(":scope > .toggle");
          if (t) t.textContent = "▸";
        }
      });
    };
    content.querySelector("#dr-copy").onclick = function () {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      this.textContent = "Copied";
      setTimeout(() => (this.textContent = "Copy JSON"), 900);
    };

    const q = content.querySelector("#dr-q");
    q.addEventListener("input", () => {
      root.querySelectorAll("mark").forEach((m) => {
        m.replaceWith(document.createTextNode(m.textContent));
      });
      const term = q.value.trim();
      if (!term) return;
      const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const walk = (el) => {
        [...el.childNodes].forEach((n) => {
          if (n.nodeType === 3 && rx.test(n.nodeValue)) {
            const span = document.createElement("span");
            span.innerHTML = n.nodeValue.replace(
              rx,
              (m) => `<mark>${m}</mark>`,
            );
            n.parentNode.replaceChild(span, n);
            // expand ancestors so the match is visible
            let p = span;
            while (p && p !== root) {
              if (p.classList && p.classList.contains("collapsed")) {
                p.classList.remove("collapsed");
                const tg = p.querySelector(":scope > .toggle");
                if (tg) tg.textContent = "▾";
              }
              p = p.parentNode;
            }
          } else if (n.nodeType === 1) walk(n);
        });
      };
      walk(root);
    });
  };

  // Dispatch table
  const RENDERERS = {
    markdown: (msg) => renderMarkdown(msg.raw),
    code: (msg) => renderCode(msg.raw, msg.lang),
    json: (msg) => renderJSON(msg.raw),
  };

  window.addEventListener("message", (e) => {
    const msg = e.data;
    if (!msg || typeof msg !== "object" || msg.app !== "simplyview") return;
    try {
      const render = RENDERERS[msg.type];
      if (!render) throw new Error("Unknown renderer: " + msg.type);
      content.classList.remove("loading");
      document.body.dataset.mode = msg.type;
      render(msg);
    } catch (err) {
      console.error("[SimplyView]", err);
      showError(err.message || String(err));
    }
  });

  // Signal to parent that we're ready to receive content.
  window.parent.postMessage({ app: "simplyview", type: "ready" }, "*");
})();
