# Possibility Strategy Site

## Auto-deploy rule
After EVERY code change, immediately `git add`, `git commit`, and `git push` to deploy to Vercel. Do not wait for the user to ask. Every edit must be live within seconds of being made.

## Project structure
- `public/`: Static HTML pages deployed via Vercel
  - `jim-marketing-playbook.html`: Marketing automation playbook (~6000+ lines)
  - `jim-strategy-briefing.html`: Strategic briefing (~4000 lines)
  - `the-thesis.html`: The Thesis page (~2500 lines)
- `api/`: Vercel serverless functions
- Deploys automatically on push to `main` via Vercel

## Key conventions
- All three pages are single-file HTML with embedded CSS and JS
- CSS media queries at: 1024px, 900px, 768px, 480px, 375px, 320px
- Inline styles are overridden via `[style*="..."]` attribute selectors with `!important`
- Mobile touch targets: 44px minimum (Apple HIG)
- Brand color: teal (`--teal`, `--teal-bright`)
- Font stack: system fonts with serif accents

## Design rules
- Colored accent borders on cards are strictly forbidden (no `border-top/left/right/bottom: Npx solid` using pillar or brand colors like `--release`, `--align`, `--become`, `--teal`)
- Phase/section dividers must be neutral (e.g. `rgba(26,20,16,0.08)`) not colored gradients
- Pink/red/release-colored card backgrounds are strictly forbidden (no `background: var(--release-soft)`, no `background: rgba(232,117,138,...)` on cards, containers, or content blocks). Use neutral backgrounds instead: `rgba(26,20,16,0.025)` for light sections, `rgba(255,255,255,0.03)` for dark sections. Release color is allowed only on small UI elements (text labels, tiny dot indicators) not on card/container fills.

## Unlisted pages (do not link anywhere)
- `marketing-plan.html`: Client proposal, unlisted until further notice. Do NOT add links to this page from the hub, sidebars, mobile menus, cross-nav, or any other page. The page must remain live at its direct URL for sharing but completely invisible to anyone browsing the site.
- `workshop.html`: The Workshop (internal idea capture and strategy verification tool). PIN-protected. Do NOT add links from any other page. Do NOT include in AI chat embeddings.
- `tracker.html`: Launch Tracker (collaborative project management for app launch milestones). Auth-protected via Supabase login. Do NOT add links from any other page.
- `progress-tracker.html`: Deprecated, replaced by tracker.html. Do NOT link.


## Writing style rules
- Em dashes (—) are strictly forbidden in all content
- Hyphens used as connecting sentence structure (e.g. "we build strategies - not campaigns") are strictly forbidden
- Use periods, commas, colons, semicolons, or restructure sentences instead
