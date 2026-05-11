/* SimplyView — file-type detection
   Maps filename extensions to a renderer type. The actual rendering happens
   in renderer-main.js inside renderer.html (loaded as an iframe from the
   chrome-extension:// origin). Exposes window.SimplyView in the content-
   script isolated world. */

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

  window.SimplyView = { detectType };
})();
