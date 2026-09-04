# Daily Expense React

Frontend application for expense, sales, inventory, GST, CRM, vendor, and organisation workflows. The codebase has grown beyond a starter template, so this README is focused on helping the next developer start fast and work in a consistent way.

## Stack

- React 18
- Vite 6
- Redux Toolkit
- React Router
- Material UI
- Axios

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Start the app:

```bash
npm run dev
```

4. Validate before pushing:

```bash
npm run check
```

## Environment Variables

The project currently depends on:

```env
VITE_API_BASE_URL=
VITE_APP_EDITION=full
```

See [.env.example](/var/www/html/daily-expence-react-main/.env.example).

## Available Scripts

- `npm run dev`: start Vite dev server on host mode
- `npm run start`: alias of dev mode
- `npm run build`: production build for the full app
- `npm run build:main`: production build for the main app without CRM routes
- `npm run build:crm`: production build for the CRM-only client edition
- `npm run dev:main`: start dev server for the main app without CRM routes
- `npm run dev:crm`: start dev server for the CRM-only client edition
- `npm run preview`: preview production build
- `npm run lint`: run ESLint across the repo
- `npm run lint:fix`: auto-fix lint issues where possible
- `npm run check`: lint + production build

## Current Project Structure

```text
src/
  api/            axios client setup
  components/     reusable UI and cross-page widgets
  config/         route definitions and API config
  hooks/          custom hooks
  pages/          route-level screens
  redux/          slices and root reducer
  services/       API service wrappers
```

Important entry files:

- [src/main.jsx](/var/www/html/daily-expence-react-main/src/main.jsx)
- [src/App.jsx](/var/www/html/daily-expence-react-main/src/App.jsx)
- [src/AppRoutes.jsx](/var/www/html/daily-expence-react-main/src/AppRoutes.jsx)
- [src/config/appRoutes.jsx](/var/www/html/daily-expence-react-main/src/config/appRoutes.jsx)
- [src/store.js](/var/www/html/daily-expence-react-main/src/store.js)
- [src/redux/rootReducer.js](/var/www/html/daily-expence-react-main/src/redux/rootReducer.js)

## Functional Modules

- Auth: login, register, OTP verification
- Core finance: accounts, transactions, budget, loans, reports
- Sales: clients, invoices, invoice payments, ledger
- GST: dashboard, GSTR-1, GSTR-3B, returns
- Inventory: products, attributes, movements, reports
- Vendors and purchase returns
- CRM: leads and campaigns
- Organisation and admin: organisation setup/settings, users, roles

## App Editions And Module Separation

The app supports build-time editions through `VITE_APP_EDITION` in [src/config/moduleConfig.js](/var/www/html/daily-expence-react-main/src/config/moduleConfig.js). Use this when a client needs only one module, or when the main app should be delivered without a module.

Supported editions today:

- `full`: complete app, including CRM. This is the default.
- `main`: main app without CRM routes/sidebar entries.
- `crm`: CRM-only client edition. Login redirects to `/crm/leads`.

Build commands:

```bash
npm run build        # full app
npm run build:main   # main app without CRM
npm run build:crm    # CRM-only app
```

How the separation works:

- [src/config/moduleConfig.js](/var/www/html/daily-expence-react-main/src/config/moduleConfig.js) reads `VITE_APP_EDITION` and exposes flags such as `isCrmEnabled`, `isCrmOnlyEdition`, and `defaultProtectedPath`.
- [src/config/appRoutes.jsx](/var/www/html/daily-expence-react-main/src/config/appRoutes.jsx) keeps all routes in `allProtectedRoutes`, then exports a filtered `protectedRoutes` list based on the selected edition. Sidebar and route matching use this filtered list.
- [src/redux/rootReducer.js](/var/www/html/daily-expence-react-main/src/redux/rootReducer.js) attaches reducers based on the selected edition. CRM reducers are excluded from the `main` edition, and non-CRM business reducers are excluded from the `crm` edition.
- [src/AppRoutes.jsx](/var/www/html/daily-expence-react-main/src/AppRoutes.jsx) uses `defaultProtectedPath` so each edition redirects to the correct landing page after login or blocked permission access.

To separate another module, for example `inventory`:

1. Add the new edition name in `moduleConfig.js`, for example `inventory`.
2. Add flags such as `isInventoryOnlyEdition` and set its default route, for example `/inventory/dashboard`.
3. Update `routeMatchesEdition` in `appRoutes.jsx` to return only `route.group === "inventory"` for the inventory-only edition.
4. Move the module reducers into a module reducer object in `rootReducer.js`, then attach them only when that edition needs them.
5. Add scripts in `package.json`, for example `build:inventory` and `dev:inventory`.
6. Update `.env.example` and this README with the new edition.

Important: the current setup gives runtime/client deployment separation. Because the route registry still declares lazy imports for all pages, Vite may still emit lazy chunks for modules that are disabled at runtime. If a client build must physically exclude every unused module chunk from `dist/`, split route definitions into separate edition-specific route modules or entry points.

## Working Conventions

- Keep route-level screens in `src/pages`.
- Keep reusable shared UI in `src/components`.
- Keep API client concerns in `src/api` and `src/services`.
- Keep Redux slice state in `src/redux/features`.
- Prefer one naming style only:
  - Components and pages: `PascalCase`
  - Hooks: `useSomething`
  - Utilities/config/service variables: `camelCase`
- Do not add hardcoded URLs directly in feature files. Use `src/config/apiConfig.js`.
- Avoid mixing page UI, API logic, and data transformation in one file when adding new features.

## Recommended Next Refactor

The current code works, but it will be easier to maintain if future changes move toward feature-based folders:

```text
src/
  app/
    routes/
    store/
  features/
    auth/
    inventory/
    sales/
    vendors/
    crm/
    organisation/
    admin/
  shared/
    api/
    components/
    hooks/
    utils/
```

This does not need to be done in one large rewrite. Move one module at a time.

## Onboarding Checklist For New Developers

1. Read this README.
2. Review [docs/ARCHITECTURE.md](/var/www/html/daily-expence-react-main/docs/ARCHITECTURE.md).
3. Configure `.env` from `.env.example`.
4. Run `npm run dev`.
5. Review routes in [src/config/appRoutes.jsx](/var/www/html/daily-expence-react-main/src/config/appRoutes.jsx).
6. Review global layout and auth flow in [src/AppRoutes.jsx](/var/www/html/daily-expence-react-main/src/AppRoutes.jsx).
7. Run `npm run check` before opening a PR.

## Known Improvement Areas

- File naming is not fully consistent yet.
- Some slices contain both API and state logic.
- Route config is doing multiple responsibilities: routing, menu metadata, and permissions.
- The project still follows a mostly technical-layer structure instead of a pure feature-module structure.

## Notes

- `dist/` and `node_modules/` should stay out of version control.
- If you add a new module, document it here and in the architecture notes.
