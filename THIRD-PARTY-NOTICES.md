# Third-party notices

## TailAdmin Free Next.js Admin Dashboard

Source: user-supplied `free-nextjs-admin-dashboard-main.zip`, package name `free-nextjs-admin-dashboard`, version field `2.4.0`.
Upstream reference: https://github.com/TailAdmin/free-nextjs-admin-dashboard
License: MIT, Copyright (c) 2023 TailAdmin.
Full notice: `licenses/TailAdmin-MIT.txt`, preserved verbatim.

Adapted areas: brand/color/gray tokens from `src/app/globals.css`, sidebar/header patterns from `src/layout/AppSidebar.tsx` and `AppHeader.tsx`, split-auth/form/card/table visual patterns from auth/common/UI/table components. Reimplemented to fit existing HSSE Next14/React18/Tailwind3 contracts; not a wholesale template installation.

Copied asset: `public/images/shape/grid-01.svg` (decorative auth grid). TailAdmin logos, user photos, demo commerce data, charts, notifications, social sign-in and Pro assets are not included.

System fonts are used; no font binary or remote font service added. Existing HSSE dependencies retain their own licenses in their packages; this notice does not relicense all HSSE source as TailAdmin or assert ownership of project business logic.
