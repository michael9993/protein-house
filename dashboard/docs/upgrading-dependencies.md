# Upgrading Dashboard Dependencies

## General approach

**Do not upgrade everything at once.** Upgrade in stages and test after each batch.

1. **Check what’s outdated**
   ```bash
   cd dashboard && pnpm outdated
   ```

2. **Upgrade in this order**
   - **Patch/minor** (e.g. 2.30.7 → 2.30.8): Low risk. Run `pnpm update` or bump specific packages.
   - **EditorJS stack** (`@editorjs/editorjs`, `@editorjs/paragraph`, `@react-editor-js/core`): Check release notes for breaking changes; RichTextEditor depends on these.
   - **React / React DOM**: Keep in sync; test thoroughly.
   - **Material-UI v4 → v5/v6**: Large migration (findDOMNode, defaultProps, theme API). Plan separately; consider staying on v4 until you’re ready for a dedicated migration.

3. **After upgrades**
   - Run `pnpm build` and fix any type/build errors.
   - Manually test RichTextEditor (product description, discount rule description) and Combobox (channel, category, etc.).

## Strict Mode and production build

If RichTextEditor or Combobox misbehave (e.g. content disappearing, double-mount):

- **Development:** Run with Strict Mode off:
  ```bash
  pnpm dev:no-strict
  ```
  Or set `VITE_DISABLE_STRICT_MODE=true` in `.env` (or in the environment) so Vite bakes it into the client.

- **Production build:** Strict Mode is already off in production (`import.meta.env.DEV` is false). To make the “no Strict Mode” choice explicit in the bundle (e.g. for consistency or future build modes):
  - Set `VITE_DISABLE_STRICT_MODE=true` in `.env` (or in the env when running the build), **or**
  - Run:
  ```bash
  pnpm build:no-strict
  ```
  The value must be present at **build time** so it is embedded in the bundle.

- **Docker (infra):** The dashboard container runs `pnpm run build` inside the container. For the flag to be baked in:
  1. Add `VITE_DISABLE_STRICT_MODE=true` to **infra/.env** (not dashboard/.env).
  2. Rebuild/restart the dashboard container so the build step runs with that env:
     ```bash
     docker compose -f infra/docker-compose.dev.yml up -d --build aura-dashboard
     ```
     Or restart after changing .env (the container runs install + generate + build on start, so a full restart will rebuild with the new env).

## Key packages (as of this doc)

- **@editorjs/editorjs** – Rich text engine; avoid major jumps without testing.
- **@react-editor-js/core** – React wrapper; version should match EditorJS.
- **@material-ui/core** (v4) – Legacy context / findDOMNode warnings come from here; fixing them means migrating to MUI v5+.
- **macaw-ui** – Saleor design system; follow Saleor’s upgrade guidance.
