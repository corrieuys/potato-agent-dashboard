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
  <style>
    :root {
      color-scheme: dark;
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
      --shadow: 0 16px 34px rgba(0, 0, 0, 0.35);
      --radius-lg: 16px;
      --radius-md: 12px;
      --radius-sm: 8px;
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
      background: rgba(11, 15, 20, 0.75);
      border-bottom: 1px solid var(--panel-border);
    }
    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 12px 20px;
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      font-weight: 700;
      font-size: 1.05rem;
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
      font-size: 0.65rem;
      padding: 3px 7px;
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
      padding: 5px 8px;
      border-radius: 999px;
    }
    .nav-link:hover { color: var(--ink); background: rgba(148, 163, 184, 0.12); }

    .page {
      position: relative;
      z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px 20px 48px;
    }
    .kicker { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
    .headline { font-size: clamp(1.7rem, 3.6vw, 2.6rem); font-weight: 700; letter-spacing: -0.03em; }
    .subtle { color: var(--muted); }
    .mono { font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace; }

    .panel {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      padding: 18px;
    }
    .panel-strong { background: var(--panel-strong); }
    .panel-hover { transition: border-color 0.2s ease; }
    .panel-hover:hover { border-color: rgba(15, 118, 110, 0.35); }

    .btn {
      border-radius: 999px;
      padding: 8px 14px;
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
    .btn-compact {
      padding: 5px 10px;
      font-size: 0.68rem;
      min-height: 28px;
      border-radius: 999px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .btn-hero {
      min-height: 38px;
      padding: 8px 14px;
      font-size: 0.85rem;
      letter-spacing: 0.01em;
    }
    .btn-hero svg { width: 18px; height: 18px; }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(15, 118, 110, 0.1);
      color: var(--accent);
      font-size: 0.7rem;
      font-weight: 600;
      border: 1px solid rgba(15, 118, 110, 0.2);
    }
    .chip-muted {
      background: rgba(148, 163, 184, 0.16);
      color: var(--muted);
      border-color: rgba(148, 163, 184, 0.3);
    }
    .badge {
      padding: 4px 10px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.65rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .badge-green { background: rgba(34, 197, 94, 0.16); color: #15803d; }
    .badge-yellow { background: rgba(245, 158, 11, 0.16); color: #b45309; }
    .badge-gray { background: rgba(148, 163, 184, 0.18); color: var(--muted); }
    .badge-red { background: rgba(239, 68, 68, 0.16); color: #b91c1c; }

    .field { display: grid; gap: 6px; }
    .label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
    .input, select, textarea {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-sm);
      padding: 7px 9px;
      font-size: 0.85rem;
      color: var(--ink);
      outline: none;
    }
    .input:focus, select:focus, textarea:focus { border-color: rgba(15, 118, 110, 0.6); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15); }

    .section-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--panel-border);
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 6px 0 0;
    }
    .section-kicker {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--muted);
    }
    .card-grid { display: grid; gap: 18px; }
    .card-grid-2 { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }

    .service-card {
      background: var(--panel-strong);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      padding: 14px 16px;
      display: grid;
      gap: 12px;
      transition: border-color 0.2s ease;
    }
    .service-card:hover { border-color: rgba(15, 118, 110, 0.35); }
    .service-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .service-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .service-title { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
    .service-meta { color: var(--muted); font-size: 0.8rem; }
    .service-actions { display: flex; gap: 8px; }
    .service-rail { display: grid; gap: 10px; align-content: start; }
    .service-divider { height: 1px; background: var(--panel-border); }
    .service-path {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      border: 1px solid rgba(15, 118, 110, 0.25);
      background: rgba(15, 118, 110, 0.08);
    }
    .service-path::before {
      content: "path";
      font-size: 0.6rem;
      color: var(--muted);
      letter-spacing: 0.2em;
    }

    .stack-hero {
      border-radius: var(--radius-lg);
      border: 1px solid var(--panel-border);
      background: linear-gradient(120deg, rgba(15, 118, 110, 0.12), rgba(245, 158, 11, 0.12)), var(--panel-strong);
      box-shadow: var(--shadow);
      padding: 16px 18px;
    }
    .stack-hero-inner {
      display: grid;
      gap: 16px;
    }
    .stack-hero-title {
      font-size: clamp(1.6rem, 2.8vw, 2.2rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      margin: 0;
    }
    .stack-hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .stack-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(15, 118, 110, 0.18);
      background: rgba(15, 118, 110, 0.08);
      color: var(--ink);
      font-size: 0.72rem;
      font-weight: 600;
    }
    .stack-chip span { color: var(--muted); font-weight: 500; }
    .stack-hero-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .stack-section { padding: 18px 20px; }

    .modal {
      position: fixed;
      inset: 0;
      background: rgba(7, 12, 20, 0.6);
      backdrop-filter: blur(10px);
      z-index: 50;
      display: grid;
      place-items: center;
      padding: 14px;
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
      padding: 18px 22px 22px;
      flex: 1;
      min-height: 0;
      background: transparent;
    }
    .modal-footer {
      margin-top: auto;
      padding: 14px 22px 18px;
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
      </a>
      <div class="nav-actions">
        <a href="/stacks" class="nav-link">Stacks</a>
        <a href="/docs" class="nav-link">Docs</a>
      </div>
    </div>
  </nav>
  <main class="page">
    ${content}
  </main>
</body>
</html>`;
}
