/* SimplyView — renderer dispatch + builders
   Exposes window.SimplyView (in the content-script isolated world). */

(() => {
  const TYPE_MAP = {
    html: { type: "html", label: "HTML" },
    htm: { type: "html", label: "HTML" },

    md: { type: "markdown", label: "Markdown" },
    markdown: { type: "markdown", label: "Markdown" },
    mdx: { type: "markdown", label: "MDX" },

    json: { type: "json", label: "JSON" },
    geojson: { type: "json", label: "GeoJSON" },

    js: { type: "code", lang: "javascript", label: "JavaScript" },
    mjs: { type: "code", lang: "javascript", label: "JavaScript" },
    cjs: { type: "code", lang: "javascript", label: "JavaScript" },
    ts: { type: "code", lang: "typescript", label: "TypeScript" },
    jsx: { type: "code", lang: "javascript", label: "JSX" },
    tsx: { type: "code", lang: "typescript", label: "TSX" },
    py: { type: "code", lang: "python", label: "Python" },
    rb: { type: "code", lang: "ruby", label: "Ruby" },
    go: { type: "code", lang: "go", label: "Go" },
    rs: { type: "code", lang: "rust", label: "Rust" },
    java: { type: "code", lang: "java", label: "Java" },
    kt: { type: "code", lang: "kotlin", label: "Kotlin" },
    swift: { type: "code", lang: "swift", label: "Swift" },
    cs: { type: "code", lang: "csharp", label: "C#" },
    c: { type: "code", lang: "c", label: "C" },
    h: { type: "code", lang: "c", label: "C header" },
    cpp: { type: "code", lang: "cpp", label: "C++" },
    hpp: { type: "code", lang: "cpp", label: "C++ header" },
    php: { type: "code", lang: "php", label: "PHP" },
    css: { type: "code", lang: "css", label: "CSS" },
    scss: { type: "code", lang: "scss", label: "SCSS" },
    less: { type: "code", lang: "less", label: "Less" },
    yaml: { type: "code", lang: "yaml", label: "YAML" },
    yml: { type: "code", lang: "yaml", label: "YAML" },
    toml: { type: "code", lang: "ini", label: "TOML" },
    ini: { type: "code", lang: "ini", label: "INI" },
    sql: { type: "code", lang: "sql", label: "SQL" },
    sh: { type: "code", lang: "bash", label: "Shell" },
    bash: { type: "code", lang: "bash", label: "Bash" },
    zsh: { type: "code", lang: "bash", label: "Zsh" },
    fish: { type: "code", lang: "bash", label: "Fish" },
    ps1: { type: "code", lang: "powershell", label: "PowerShell" },
    dockerfile: { type: "code", lang: "dockerfile", label: "Dockerfile" },
    xml: { type: "code", lang: "xml", label: "XML" },
    diff: { type: "code", lang: "diff", label: "Diff" },
    patch: { type: "code", lang: "diff", label: "Patch" },
    lua: { type: "code", lang: "lua", label: "Lua" },
    r: { type: "code", lang: "r", label: "R" },
    scala: { type: "code", lang: "scala", label: "Scala" },
    pl: { type: "code", lang: "perl", label: "Perl" },
    dart: { type: "code", lang: "dart", label: "Dart" },
    vue: { type: "code", lang: "xml", label: "Vue" },
    svelte: { type: "code", lang: "xml", label: "Svelte" },
    graphql: { type: "code", lang: "graphql", label: "GraphQL" },
    gql: { type: "code", lang: "graphql", label: "GraphQL" },
    proto: { type: "code", lang: "protobuf", label: "Protobuf" },
  };

  const detectType = (filename) => {
    if (!filename) return null;
    const ext = (filename.match(/\.([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();
    return TYPE_MAP[ext] || null;
  };

  // Cached vendor asset loader (chrome-extension:// resources)
  const _cache = {};
  const loadAsset = async (path) => {
    if (_cache[path]) return _cache[path];
    const url = chrome.runtime.getURL(path);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    _cache[path] = await res.text();
    return _cache[path];
  };

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

  // Shared base styles for rendered pages
  const BASE_CSS = `
    :root { color-scheme: light dark; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 15px; line-height: 1.6;
      color: #1F2328;
      background: #fff;
      padding: 40px 48px 80px;
      max-width: 920px; margin: 0 auto;
    }
    @media (prefers-color-scheme: dark) {
      body { color: #e6edf3; background: #0d1117; }
    }
  `;

  // ---- HTML ----
  const renderHtml = (raw) => raw; // pass-through; user HTML is its own page

  // ---- Markdown ----
  const renderMarkdown = async (raw) => {
    const [mdjs, hljsjs, hlcssDark, hlcssLight] = await Promise.all([
      loadAsset("vendor/markdown-it.min.js"),
      loadAsset("vendor/highlight.min.js"),
      loadAsset("vendor/github-dark.min.css"),
      loadAsset("vendor/github.min.css"),
    ]);

    const ghMarkdownCss = `
      body { font-size: 16px; }
      h1,h2,h3,h4,h5,h6 { font-weight: 600; line-height: 1.25; margin: 24px 0 16px; }
      h1 { font-size: 2em; padding-bottom: .3em; border-bottom: 1px solid rgba(128,128,128,.2); }
      h2 { font-size: 1.5em; padding-bottom: .3em; border-bottom: 1px solid rgba(128,128,128,.2); }
      h3 { font-size: 1.25em; }
      h4 { font-size: 1em; }
      p { margin: 0 0 16px; }
      a { color: #0969da; text-decoration: none; }
      a:hover { text-decoration: underline; }
      @media (prefers-color-scheme: dark) { a { color: #2f81f7; } }
      code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 85%; padding: .2em .4em; border-radius: 6px;
        background: rgba(175,184,193,.2); }
      pre { background: #0d1117; color: #e6edf3; padding: 16px; border-radius: 8px;
        overflow: auto; font-size: 14px; line-height: 1.5; }
      pre code { background: transparent; padding: 0; font-size: 100%; }
      @media (prefers-color-scheme: light) {
        pre { background: #f6f8fa; color: #1f2328; }
      }
      blockquote { margin: 0 0 16px; padding: 0 1em; border-left: .25em solid #d0d7de;
        color: #59636e; }
      @media (prefers-color-scheme: dark) {
        blockquote { border-left-color: #3d444d; color: #9198a1; }
      }
      ul, ol { padding-left: 2em; margin: 0 0 16px; }
      li + li { margin-top: .25em; }
      img { max-width: 100%; }
      hr { border: 0; border-top: 1px solid rgba(128,128,128,.3); margin: 24px 0; }
      table { border-collapse: collapse; margin: 0 0 16px; display: block; overflow: auto; }
      th, td { border: 1px solid rgba(128,128,128,.3); padding: 6px 13px; }
      tr:nth-child(2n) { background: rgba(128,128,128,.08); }
      input[type=checkbox] { margin-right: 6px; }
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Markdown</title>
<style>${BASE_CSS}${ghMarkdownCss}</style>
<style id="hl-dark" media="(prefers-color-scheme: dark)">${hlcssDark}</style>
<style id="hl-light" media="(prefers-color-scheme: light)">${hlcssLight}</style>
</head><body>
<div id="content"></div>
<script>${hljsjs}</script>
<script>${mdjs}</script>
<script>
(function(){
  const md = window.markdownit({
    html: true, linkify: true, typographer: true, breaks: false,
    highlight: function(str, lang){
      if (lang && hljs.getLanguage(lang)) {
        try { return hljs.highlight(str, {language: lang}).value; } catch(e){}
      }
      try { return hljs.highlightAuto(str).value; } catch(e){}
      return '';
    }
  });
  const RAW = ${JSON.stringify(raw)};
  document.getElementById('content').innerHTML = md.render(RAW);
  // GFM-style task list checkboxes
  document.querySelectorAll('li').forEach(function(li){
    if(/^\\s*\\[[ xX]\\]\\s/.test(li.textContent)){
      li.innerHTML = li.innerHTML.replace(/^\\s*\\[(.)\\]\\s/, function(_,m){
        return '<input type="checkbox" disabled '+(m.trim()?'checked':'')+'>';
      });
    }
  });
})();
</script>
</body></html>`;
  };

  // ---- Code ----
  const renderCode = async (raw, lang) => {
    const [hljsjs, hlcssDark, hlcssLight] = await Promise.all([
      loadAsset("vendor/highlight.min.js"),
      loadAsset("vendor/github-dark.min.css"),
      loadAsset("vendor/github.min.css"),
    ]);
    const codeCss = `
      body { padding: 0; max-width: none; }
      .toolbar { position: sticky; top: 0; z-index: 1;
        background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
        border-bottom: 1px solid rgba(128,128,128,.2);
        padding: 10px 16px; font-size: 12px; color: #59636e;
        display: flex; justify-content: space-between; align-items: center; }
      @media (prefers-color-scheme: dark) {
        .toolbar { background: rgba(13,17,23,0.9); color: #9198a1;
          border-bottom-color: rgba(128,128,128,.2); }
      }
      .toolbar .lang { font-weight: 600; }
      .toolbar button { font: inherit; cursor: pointer;
        background: transparent; border: 1px solid rgba(128,128,128,.3);
        color: inherit; border-radius: 6px; padding: 4px 10px; }
      .toolbar button:hover { background: rgba(128,128,128,.12); }
      pre { margin: 0; padding: 20px 24px;
        font: 13px/1.55 ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
      pre code { display: block; }
      .ln {
        display: inline-block; width: 3.5em; padding-right: 1em;
        text-align: right; color: rgba(128,128,128,.55);
        user-select: none;
      }
    `;
    const langAttr = lang ? `language-${lang}` : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Code</title>
<style>${BASE_CSS}${codeCss}</style>
<style media="(prefers-color-scheme: dark)">${hlcssDark}</style>
<style media="(prefers-color-scheme: light)">${hlcssLight}</style>
</head><body>
<div class="toolbar">
  <span class="lang">${esc(lang || "plain text")}</span>
  <button onclick="navigator.clipboard.writeText(document.getElementById('raw').textContent).then(()=>{this.textContent='Copied';setTimeout(()=>this.textContent='Copy',900)})">Copy</button>
</div>
<pre><code class="${langAttr}" id="raw">${esc(raw)}</code></pre>
<script>${hljsjs}</script>
<script>
  (function(){
    const el = document.getElementById('raw');
    try { hljs.highlightElement(el); } catch(e){}
    // line numbers
    const lines = el.innerHTML.split('\\n');
    el.innerHTML = lines.map(function(l,i){
      return '<span class="ln">'+(i+1)+'</span>'+l;
    }).join('\\n');
  })();
</script>
</body></html>`;
  };

  // ---- JSON ----
  const renderJSON = async (raw) => {
    const jsonCss = `
      body { padding: 0; max-width: none;
        font: 13px/1.55 ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        background: #fff; color: #1f2328; }
      @media (prefers-color-scheme: dark){
        body { background: #0d1117; color: #e6edf3; }
      }
      .toolbar { position: sticky; top: 0; z-index: 1;
        background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
        border-bottom: 1px solid rgba(128,128,128,.2);
        padding: 10px 16px; font-size: 12px; color: #59636e;
        display: flex; gap: 8px; align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
      @media (prefers-color-scheme: dark){
        .toolbar { background: rgba(13,17,23,0.9); color: #9198a1; }
      }
      .toolbar .stats { color: rgba(128,128,128,.85); margin-right: auto; }
      .toolbar button, .toolbar input {
        font: inherit; background: transparent; color: inherit;
        border: 1px solid rgba(128,128,128,.3); border-radius: 6px;
        padding: 4px 10px;
      }
      .toolbar button { cursor: pointer; }
      .toolbar button:hover { background: rgba(128,128,128,.12); }
      .toolbar input { min-width: 200px; }
      .tree { padding: 14px 20px 60px; }
      .node { padding-left: 1.2em; position: relative; }
      .node > .toggle {
        position: absolute; left: 0; top: 0; cursor: pointer;
        user-select: none; width: 1em; text-align: center;
        color: rgba(128,128,128,.7);
      }
      .node.collapsed > .children { display: none; }
      .node.collapsed > .ellipsis { display: inline; color: rgba(128,128,128,.6); }
      .ellipsis { display: none; }
      .k { color: #953800; }
      .s { color: #0a3069; }
      .n { color: #0550ae; }
      .b { color: #8250df; }
      .nl { color: #6e7781; }
      @media (prefers-color-scheme: dark){
        .k { color: #ffa657; }
        .s { color: #a5d6ff; }
        .n { color: #79c0ff; }
        .b { color: #d2a8ff; }
        .nl { color: #8b949e; }
      }
      mark { background: #fff3a0; color: inherit; border-radius: 2px; }
      @media (prefers-color-scheme: dark){ mark { background: #4d3f00; color: #fff; } }
      .error { padding: 24px; color: #cf222e; }
    `;
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>JSON</title>
<style>${BASE_CSS}${jsonCss}</style>
</head><body>
<div class="toolbar">
  <span class="stats" id="stats"></span>
  <input id="q" placeholder="Search keys / values…">
  <button id="expand">Expand all</button>
  <button id="collapse">Collapse all</button>
  <button id="copy">Copy JSON</button>
</div>
<div id="root" class="tree"></div>
<script>
(function(){
  const RAW = ${JSON.stringify(raw)};
  let data;
  try { data = JSON.parse(RAW); }
  catch(e){
    document.getElementById('root').innerHTML = '<div class="error">Invalid JSON: '+String(e.message).replace(/[<>&]/g,'')+'</div>';
    return;
  }

  let nodes = 0, leaves = 0;
  function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function build(v, key, isLast){
    nodes++;
    const wrap = document.createElement('div');
    wrap.className = 'node';
    const head = document.createElement('span');
    const tail = document.createElement('span');
    const ellipsis = document.createElement('span');
    ellipsis.className = 'ellipsis';

    let label = '';
    if (key !== undefined) label = '<span class="k">"'+esc(key)+'"</span><span class="nl">: </span>';

    if (Array.isArray(v)) {
      const toggle = document.createElement('span');
      toggle.className = 'toggle'; toggle.textContent = '▾';
      wrap.appendChild(toggle);
      head.innerHTML = label + '<span class="nl">[</span>';
      ellipsis.innerHTML = '<span class="nl">…' + v.length + ' items…</span>';
      wrap.appendChild(head);
      wrap.appendChild(ellipsis);
      const children = document.createElement('div');
      children.className = 'children';
      v.forEach(function(item, i){
        children.appendChild(build(item, undefined, i === v.length - 1));
      });
      wrap.appendChild(children);
      tail.innerHTML = '<span class="nl">]'+(isLast?'':',')+'</span>';
      wrap.appendChild(tail);
      toggle.onclick = function(){ wrap.classList.toggle('collapsed'); toggle.textContent = wrap.classList.contains('collapsed')?'▸':'▾'; };
    } else if (v && typeof v === 'object') {
      const toggle = document.createElement('span');
      toggle.className = 'toggle'; toggle.textContent = '▾';
      wrap.appendChild(toggle);
      head.innerHTML = label + '<span class="nl">{</span>';
      const keys = Object.keys(v);
      ellipsis.innerHTML = '<span class="nl">…' + keys.length + ' keys…</span>';
      wrap.appendChild(head);
      wrap.appendChild(ellipsis);
      const children = document.createElement('div');
      children.className = 'children';
      keys.forEach(function(k, i){
        children.appendChild(build(v[k], k, i === keys.length - 1));
      });
      wrap.appendChild(children);
      tail.innerHTML = '<span class="nl">}'+(isLast?'':',')+'</span>';
      wrap.appendChild(tail);
      toggle.onclick = function(){ wrap.classList.toggle('collapsed'); toggle.textContent = wrap.classList.contains('collapsed')?'▸':'▾'; };
    } else {
      leaves++;
      let val;
      if (typeof v === 'string') val = '<span class="s">"' + esc(v) + '"</span>';
      else if (typeof v === 'number') val = '<span class="n">' + v + '</span>';
      else if (typeof v === 'boolean') val = '<span class="b">' + v + '</span>';
      else if (v === null) val = '<span class="b">null</span>';
      else val = esc(String(v));
      head.innerHTML = label + val + '<span class="nl">'+(isLast?'':',')+'</span>';
      wrap.appendChild(head);
    }
    return wrap;
  }

  const root = document.getElementById('root');
  root.appendChild(build(data, undefined, true));
  document.getElementById('stats').textContent = nodes + ' nodes · ' + leaves + ' values';

  document.getElementById('expand').onclick = function(){
    document.querySelectorAll('.node.collapsed').forEach(function(n){
      n.classList.remove('collapsed');
      const t = n.querySelector(':scope > .toggle'); if(t) t.textContent = '▾';
    });
  };
  document.getElementById('collapse').onclick = function(){
    document.querySelectorAll('.node').forEach(function(n){
      if (n.querySelector(':scope > .children')) {
        n.classList.add('collapsed');
        const t = n.querySelector(':scope > .toggle'); if(t) t.textContent = '▸';
      }
    });
  };
  document.getElementById('copy').onclick = function(){
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    this.textContent = 'Copied'; setTimeout(()=>this.textContent='Copy JSON', 900);
  };

  // Simple search: highlights matches and expands ancestors
  const q = document.getElementById('q');
  q.addEventListener('input', function(){
    // remove old highlights
    root.querySelectorAll('mark').forEach(function(m){
      const t = document.createTextNode(m.textContent); m.parentNode.replaceChild(t, m);
    });
    const term = q.value.trim();
    if (!term) return;
    const rx = new RegExp(term.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'), 'gi');
    function walk(el){
      el.childNodes.forEach(function(n){
        if (n.nodeType === 3) {
          if (rx.test(n.nodeValue)) {
            const span = document.createElement('span');
            span.innerHTML = n.nodeValue.replace(rx, function(m){ return '<mark>'+m+'</mark>'; });
            n.parentNode.replaceChild(span, n);
            // expand ancestors
            let p = span; while(p && p !== root){ if(p.classList && p.classList.contains('collapsed')){ p.classList.remove('collapsed'); const tg=p.querySelector(':scope > .toggle'); if(tg)tg.textContent='▾'; } p=p.parentNode; }
          }
        } else if (n.nodeType === 1) walk(n);
      });
    }
    walk(root);
  });
})();
</script>
</body></html>`;
  };

  // Master dispatcher
  const render = async (type, raw, opts = {}) => {
    if (type === "html") return renderHtml(raw);
    if (type === "markdown") return renderMarkdown(raw);
    if (type === "code") return renderCode(raw, opts.lang);
    if (type === "json") return renderJSON(raw);
    throw new Error(`Unsupported renderer: ${type}`);
  };

  window.SimplyView = { detectType, render };
})();
