import { layout } from "./layout.js";
import { escapeHtml } from "./helpers.js";

// Error page
export function errorPage(message: string, status: number = 500): string {
    const content = `<div class="panel panel-strong text-center py-12">
    <div class="chip" style="margin: 0 auto;">Error ${status}</div>
    <h1 class="headline mt-4">Something went sideways</h1>
    <p class="subtle text-lg mt-2">${escapeHtml(message)}</p>
    <a href="/stacks" class="btn btn-ghost" style="margin-top: 24px;">Back to Stacks</a>
  </div>`;
    return layout(content, `Error - Potato Cloud`);
}
