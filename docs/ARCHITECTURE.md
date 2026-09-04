# Architecture Notes

This file explains how the current app is organized so a new developer can trace responsibility quickly.

## Runtime Flow

1. [src/main.jsx](/var/www/html/daily-expence-react-main/src/main.jsx) bootstraps the React app.
2. [src/App.jsx](/var/www/html/daily-expence-react-main/src/App.jsx) sets up the router and base MUI reset.
3. [src/AppRoutes.jsx](/var/www/html/daily-expence-react-main/src/AppRoutes.jsx) applies:
   - public vs protected routing
   - permission checks
   - shared layout wrapper
   - suspense fallback loading
4. [src/config/appRoutes.jsx](/var/www/html/daily-expence-react-main/src/config/appRoutes.jsx) acts as the route registry and also stores sidebar/menu metadata.

## State Management

- Redux store is created in [src/store.js](/var/www/html/daily-expence-react-main/src/store.js).
- Root reducer is assembled in [src/redux/rootReducer.js](/var/www/html/daily-expence-react-main/src/redux/rootReducer.js).
- Each domain currently has its own slice inside `src/redux/features`.

Current domains include:

- auth
- category
- accounts
- transactions
- budget
- loans
- clients
- invoices
- invoice payments
- companies
- hsn codes
- gst
- vendors
- inventory
- sales returns
- purchase returns
- attributes
- users
- roles
- leads
- campaigns
- organisations

## API Layer

- [src/api/axiosClient.jsx](/var/www/html/daily-expence-react-main/src/api/axiosClient.jsx) provides the shared Axios client and auth header injection.
- [src/config/apiConfig.js](/var/www/html/daily-expence-react-main/src/config/apiConfig.js) defines the API base URL from environment variables.
- Some domains also use `src/services/*` wrappers, but this pattern is not yet consistently applied across all modules.

## Layout And Navigation

- [src/components/Layout.jsx](/var/www/html/daily-expence-react-main/src/components/Layout.jsx) wraps protected pages.
- [src/components/Sidebar.jsx](/var/www/html/daily-expence-react-main/src/components/Sidebar.jsx) and [src/components/Navbar.jsx](/var/www/html/daily-expence-react-main/src/components/Navbar.jsx) depend on route metadata.
- Route configuration currently mixes:
  - path definitions
  - labels/icons
  - permission requirements
  - breadcrumbs
  - sidebar visibility

That is workable today, but should eventually be split if the route table keeps growing.

## Current Pain Points

- Naming is inconsistent in a few files and should be normalized.
- Some files combine too many responsibilities.
- Shared reusable components and feature-specific components are mixed under `src/components`.
- Some domains use services, while others call the API directly in slices.

## Recommended Direction

When touching old code, move incrementally toward this shape:

```text
src/
  app/
  features/
    module-name/
      components/
      pages/
      services/
      state/
  shared/
    api/
    components/
    hooks/
    utils/
```

## Rule For Future Changes

- New domain code should prefer feature grouping over cross-cutting folder sprawl.
- New API calls should go through a single domain service or clearly documented thunk pattern.
- Any new environment variable must be added to `.env.example` and `README.md`.
- Any new top-level module should be listed in this file.
