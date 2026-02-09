import { layout } from "./layout.js";

// Home page - refined and minimal
export function homePage(): string {
  const content = `
  <div class="space-y-16">
    <section class="panel panel-strong home-hero">
      <div class="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div class="kicker">Self-hosted control plane</div>
          <h1 class="headline mt-3" style="font-size: clamp(2.2rem, 5vw, 3.6rem);">
            &#129364; Potato Cloud
          </h1>
          <p class="subtle text-xl mt-4" style="opacity: 0.85;">
            A calm, modern way to run services on your own hardware.
            Configure once, push to deploy, and monitor everything in one place.
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <a href="/stacks" class="btn btn-primary btn-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Get Started
            </a>
            <a href="/docs" class="btn btn-ghost">
              Read the Docs
            </a>
          </div>
        </div>
        <div class="panel panel-strong" style="background: rgba(15, 118, 110, 0.06); border-style: dashed;">
          <div class="kicker">Highlights</div>
          <div class="mt-4 space-y-4">
            <div class="stat">
              <h4>Push to deploy</h4>
              <p>Automatic builds on git updates with safe rollouts.</p>
            </div>
            <div class="stat">
              <h4>Blue/green ready</h4>
              <p>Zero-downtime updates with quick rollback.</p>
            </div>
            <div class="stat">
              <h4>Agent-driven</h4>
              <p>Lightweight agents keep state and report health.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid md:grid-cols-2 gap-8">
      <div class="panel panel-strong">
        <h3 class="headline text-xl">Bring Your Own Infrastructure</h3>
        <p class="subtle mt-2">
          Turn any Linux machine into a production-ready control plane.
          Keep data local, reduce cloud complexity, and stay in control.
        </p>
      </div>

      <div class="panel panel-strong">
        <h3 class="headline text-xl">Git-Native Delivery</h3>
        <p class="subtle mt-2">
          Connect a repo, set build and run commands, and let the agent handle the rest.
          No YAML-heavy pipelines required.
        </p>
      </div>

      <div class="panel panel-strong">
        <h3 class="headline text-xl">Blue/Green Rollouts</h3>
        <p class="subtle mt-2">
          Keep two versions live with health checks and instant rollback.
          Deploys are safe and predictable.
        </p>
      </div>

      <div class="panel panel-strong">
        <h3 class="headline text-xl">Clear Service Health</h3>
        <p class="subtle mt-2">
          Agents report runtime state, health checks, and last-seen activity.
          You get the signal without the noise.
        </p>
      </div>
    </section>

    <section class="panel panel-strong text-center py-12">
      <h2 class="headline text-3xl">Designed for Ownership</h2>
      <p class="subtle text-lg mt-4 max-w-2xl mx-auto">
        Potato Cloud is intentionally calm: no lock-in, no noisy dashboards,
        and no surprise bills. It is built for teams that value clarity and control.
      </p>
      <div class="mt-8 grid sm:grid-cols-3 gap-6">
        <div class="panel" style="background: transparent; box-shadow: none;">
          <div class="kicker">Run Anywhere</div>
          <p class="subtle mt-2">Use the hardware you already trust.</p>
        </div>
        <div class="panel" style="background: transparent; box-shadow: none;">
          <div class="kicker">Your Data, Your Rules</div>
          <p class="subtle mt-2">Secrets stay on the agent, always encrypted.</p>
        </div>
        <div class="panel" style="background: transparent; box-shadow: none;">
          <div class="kicker">Predictable Costs</div>
          <p class="subtle mt-2">Fixed infrastructure, no metered surprises.</p>
        </div>
      </div>
    </section>

    <section class="panel panel-strong text-center py-12">
      <h2 class="headline text-2xl">Ready to get started?</h2>
      <p class="subtle mt-2">Create your first stack and deploy something in minutes.</p>
      <div class="mt-6">
        <a href="/stacks" class="btn btn-primary btn-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create Your First Stack
        </a>
      </div>
    </section>
  </div>

  <style>
    .home-hero {
      background: linear-gradient(130deg, rgba(15, 118, 110, 0.08), rgba(245, 158, 11, 0.08));
    }
  </style>
  `;

  return layout(content, "Potato Cloud - Simple Cloud Management");
}
