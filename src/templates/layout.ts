// Shared layout wrapper

export function layout(content: string, title: string = "Potato Cloud"): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/htmx.org@1.9.12"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Dark mode implementation
    if (localStorage.getItem('darkMode') === 'true' || 
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    
    function toggleDarkMode() {
      const html = document.documentElement;
      const isDark = html.classList.contains('dark');
      
      if (isDark) {
        html.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      } else {
        html.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      }
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('darkMode')) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  </script>
  <style>
    :root {
      --bg: #f6f4f1;
      --bg-2: #efe9e2;
      --panel: #ffffffcc;
      --panel-strong: #ffffff;
      --panel-border: #e6ded5;
      --ink: #0f172a;
      --muted: #5f6b7a;
      --accent: #0f766e;
      --accent-2: #f59e0b;
      --accent-3: #ef4444;
      --shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
      --radius-lg: 20px;
      --radius-md: 14px;
      --radius-sm: 10px;
    }
    .dark {
      color-scheme: dark;
    }
    .dark body {
      --bg: #0b0f14;
      --bg-2: #0f1722;
      --panel: rgba(17, 24, 39, 0.78);
      --panel-strong: #0f172a;
      --panel-border: rgba(148, 163, 184, 0.15);
      --ink: #e2e8f0;
      --muted: #94a3b8;
      --accent: #14b8a6;
      --accent-2: #f59e0b;
      --accent-3: #f97316;
      --shadow: 0 22px 44px rgba(0, 0, 0, 0.35);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Space Grotesk", system-ui, -apple-system, sans-serif;
      background: radial-gradient(1200px 600px at 20% -10%, rgba(15, 118, 110, 0.18), transparent 60%),
        radial-gradient(900px 400px at 100% 0%, rgba(245, 158, 11, 0.18), transparent 55%),
        linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%);
      color: var(--ink);
      min-height: 100vh;
    }
    [hx-target="this"].htmx-request { opacity: 0.6; }
    .fade-in { animation: fadeIn 0.35s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 999px; }

    .app-shell { position: relative; }
    .ambient {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: 0.75;
    }
    .ambient .glow {
      width: 420px;
      height: 420px;
      border-radius: 999px;
      filter: blur(70px);
      opacity: 0.5;
    }
    .ambient .glow-a { background: rgba(15, 118, 110, 0.25); top: -120px; left: -120px; }
    .ambient .glow-b { background: rgba(245, 158, 11, 0.25); top: -160px; right: -80px; }
    .ambient .gridlines {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
      background-size: 42px 42px;
      opacity: 0.35;
    }

    .nav-shell {
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(14px);
      background: rgba(246, 244, 241, 0.75);
      border-bottom: 1px solid var(--panel-border);
    }
    .dark .nav-shell { background: rgba(11, 15, 20, 0.75); }
    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px 24px;
      min-height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      font-weight: 700;
      font-size: 1.2rem;
      letter-spacing: -0.02em;
      line-height: 1;
      color: var(--ink);
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .brand svg { display: block; }
    .brand-badge {
      font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
      font-size: 0.7rem;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(15, 118, 110, 0.12);
      color: var(--accent);
      border: 1px solid rgba(15, 118, 110, 0.25);
    }
    .nav-actions { display: flex; align-items: center; gap: 14px; }
    .nav-link {
      color: var(--muted);
      text-decoration: none;
      font-weight: 500;
      padding: 6px 10px;
      border-radius: 999px;
    }
    .nav-link:hover { color: var(--ink); background: rgba(148, 163, 184, 0.12); }
    .icon-btn {
      border: 1px solid var(--panel-border);
      background: var(--panel);
      border-radius: 999px;
      padding: 8px;
      color: var(--muted);
      display: grid;
      place-items: center;
      transition: transform 0.2s ease, color 0.2s ease, border 0.2s ease;
    }
    .icon-btn:hover { color: var(--ink); border-color: rgba(15, 118, 110, 0.4); transform: translateY(-1px); }

    .page {
      position: relative;
      z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 36px 24px 60px;
    }
    .kicker { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
    .headline { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 700; letter-spacing: -0.03em; }
    .subtle { color: var(--muted); }
    .mono { font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace; }

    .panel {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      padding: 22px;
    }
    .panel-strong { background: var(--panel-strong); }
    .panel-hover { transition: transform 0.2s ease, border-color 0.2s ease; }
    .panel-hover:hover { transform: translateY(-3px); border-color: rgba(15, 118, 110, 0.35); }

    .btn {
      border-radius: 999px;
      padding: 10px 18px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid transparent;
      text-decoration: none;
    }
    .btn-primary {
      background: linear-gradient(120deg, var(--accent), #22c55e);
      color: white;
      box-shadow: 0 10px 24px rgba(15, 118, 110, 0.25);
    }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-ghost {
      background: transparent;
      border-color: var(--panel-border);
      color: var(--ink);
    }
    .btn-ghost:hover { border-color: rgba(15, 118, 110, 0.4); }
    .btn-danger {
      background: rgba(239, 68, 68, 0.12);
      color: #b91c1c;
      border-color: rgba(239, 68, 68, 0.3);
    }
    .btn-xs { padding: 6px 12px; font-size: 0.75rem; }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(15, 118, 110, 0.1);
      color: var(--accent);
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid rgba(15, 118, 110, 0.2);
    }
    .chip-muted {
      background: rgba(148, 163, 184, 0.16);
      color: var(--muted);
      border-color: rgba(148, 163, 184, 0.3);
    }
    .badge {
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .badge-green { background: rgba(34, 197, 94, 0.16); color: #15803d; }
    .badge-yellow { background: rgba(245, 158, 11, 0.16); color: #b45309; }
    .badge-gray { background: rgba(148, 163, 184, 0.18); color: var(--muted); }
    .badge-red { background: rgba(239, 68, 68, 0.16); color: #b91c1c; }

    .field { display: grid; gap: 6px; }
    .label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
    .input, select, textarea {
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      font-size: 0.9rem;
      color: var(--ink);
      outline: none;
    }
    .dark .input, .dark select, .dark textarea { background: rgba(15, 23, 42, 0.7); }
    .input:focus, select:focus, textarea:focus { border-color: rgba(15, 118, 110, 0.6); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15); }

    .section-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .card-grid { display: grid; gap: 18px; }
    .card-grid-2 { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }

    .service-card {
      background: var(--panel-strong);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      padding: 18px 20px;
      display: grid;
      gap: 16px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .service-card:hover { transform: translateY(-2px); border-color: rgba(15, 118, 110, 0.35); }
    .service-body { display: grid; gap: 16px; }
    @media (min-width: 900px) {
      .service-body { grid-template-columns: 1.2fr 0.8fr; align-items: start; }
    }
    .service-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .service-title { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
    .service-meta { color: var(--muted); font-size: 0.85rem; }
    .service-actions { display: flex; gap: 8px; }
    .service-rail { display: grid; gap: 10px; align-content: start; }
    .service-divider { height: 1px; background: var(--panel-border); }
    .service-kv { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
    .service-kv-item {
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      background: rgba(148, 163, 184, 0.08);
    }
    .service-kv-item span { display: block; font-size: 0.7rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }
    .service-kv-item strong { display: block; margin-top: 4px; font-size: 0.95rem; font-weight: 600; }

    .modal {
      position: fixed;
      inset: 0;
      background: rgba(7, 12, 20, 0.6);
      backdrop-filter: blur(10px);
      z-index: 50;
      display: grid;
      place-items: center;
      padding: 18px;
    }
    .modal-card {
      width: min(720px, 94vw);
      background: var(--panel-strong);
      border-radius: var(--radius-lg);
      border: 1px solid var(--panel-border);
      box-shadow: var(--shadow);
      padding: 0;
      max-height: calc(100vh - 36px);
      display: flex;
      flex-direction: column;
    }
    .modal-card-lg {
      width: min(1120px, 96vw);
      height: min(900px, 90vh);
    }
    .modal-header {
      padding: 22px 26px 18px;
      border-bottom: 1px solid var(--panel-border);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .modal-title { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .modal-subtitle { color: var(--muted); margin-top: 6px; }
    .modal-close {
      border: 1px solid var(--panel-border);
      background: var(--panel);
      border-radius: 999px;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      color: var(--muted);
    }
    .modal-close:hover { color: var(--ink); border-color: rgba(15, 118, 110, 0.4); }
    .divider { height: 1px; background: var(--panel-border); margin: 18px 0; }
    .modal-form { display: flex; flex-direction: column; min-height: 0; flex: 1; }
    .modal-body {
      overflow-y: auto;
      padding: 20px 26px 26px;
      flex: 1;
      min-height: 0;
      background: transparent;
    }
    .modal-footer {
      margin-top: auto;
      padding: 16px 26px 22px;
      border-top: 1px solid var(--panel-border);
      background: var(--panel-strong);
    }
    .form-grid { display: grid; gap: 18px; grid-template-columns: 1fr; }
    .form-block {
      border: 1px solid var(--panel-border);
      background: transparent;
      border-radius: var(--radius-md);
      padding: 12px 14px;
      display: grid;
      gap: 10px;
    }
    .form-block-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--muted);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--panel-border);
      margin-bottom: 4px;
    }
    @media (min-width: 900px) {
      .form-grid { grid-template-columns: 1fr 1fr; }
    }
    .stat-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .stat { padding: 14px; border-radius: var(--radius-md); background: rgba(148, 163, 184, 0.12); }
    .stat h4 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); }
    .stat p { margin: 6px 0 0; font-weight: 600; }
  </style>
</head>
<body class="app-shell">
  <div class="ambient" aria-hidden="true">
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>
    <div class="gridlines"></div>
  </div>
  <nav class="nav-shell">
    <div class="nav-inner">
      <a href="/" class="brand">
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="vertical-align: middle;">
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.5" />
            <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.6" />
          </svg>
          Potato Cloud
        </span>
        <span class="brand-badge">simple</span>
      </a>
      <div class="nav-actions">
        <a href="/stacks" class="nav-link">Stacks</a>
        <a href="/" class="nav-link">Home</a>
        <a href="/docs" class="nav-link">Docs</a>
        <button
          onclick="toggleDarkMode()"
          class="icon-btn"
          title="Toggle dark mode"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path class="dark:hidden" fill-rule="evenodd" d="M10 2a1 1 0 011-1 0 1 0 11-2a1 1 0 01-1 0 1 0 11 2zM0 18a2 2 0 105 2 2 0 10.01 2-2 2-2 2z" clip-rule="evenodd"/>
            <path class="hidden dark:block" fill-rule="evenodd" d="M17.293 13.293A8 8 0 01-5.657-5.657 8 8 0 18.343a2 2 0 105 2 2 0 11.314 0-2.686A8 8 0 011.656 5.656 0 00-5.657 5.657a8 8 0 001.656 5.656 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
  </nav>
  <main class="page">
    ${content}
  </main>
</body>
</html>`;
}
