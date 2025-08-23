# Changelog

## v0.1.0 (2025-08-20)

- Initial segmented migration to Next.js App Router and modular components
- Introduced small, focused commits to avoid hidden diffs on GitHub

### App and Core
- Base configs (.gitignore, TS, lint, Next.js config)
- App Router setup: layout, globals, auth, dynamic route
- Core layout/navigation, AccessGuard, route mapping, hooks/utils

### UI
- Core primitives (accordion, alerts, dialog, button, card, input, select, tabs)
- Extended components (calendar, menus, drawers, inputs, tables, feedback, utilities)

### Domain Batches
- Dashboard components and charts
- Trips: forms, tabs, detail views, operations, hooks, types, utils
- Clients: card, filters, summary, hooks
- Vehicles: cards, details, dialogs, filters, table, loading/error/empty
- Reports: core tabs + hooks/utils and PDF utilities (incl. vehicle inspection PDF)
- Spare parts: forms, hooks, utils, tables, tabs
- Billing: invoices (table/dialogs/hooks) and quotation dialog
- Dispatch suite: assign dialogs, board, header, trips, metrics, live map, quick actions
- Major forms: fuel log, vehicle, client, driver
- Global search + alerts components

### Backend/DB
- Supabase edge functions (create-user, send-invoice, send-quotation) and config
- Full set of SQL migrations (fuel, trips, roles/pages, vehicles, leases, escorts, invoices, quotations, and more)

### CI
- GitHub Actions workflow for build/test on push and PR

Tag: v0.1.0