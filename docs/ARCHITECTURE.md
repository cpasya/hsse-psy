# Architecture — v1.3.0

## Fondasi
Next.js 14.2.35 App Router / React 18.3.1 / TS strict / Tailwind 3 / NextAuth 4 / TanStack Query/Table / RHF/Zod / Radix / Zustand UI. Token visual dan pola layout diadaptasi dari TailAdmin Free; stack template Next16/React19/Tailwind4 tidak diimpor.

## Data dan session
Login credentials diproses server. JWT session NextAuth HttpOnly memuat token untuk server; JSON session browser hanya profil dan error. Auth API membaca `/me` setelah login dan memeriksa identity/status. `loadEffectiveToken` memvalidasi profil/permissions tanpa fallback grant stale. NextAuth callback, guard dan gateway menggunakan jalur ini. Session refetch 60 detik/focus/manual bersifat eventual, bukan push.

Browser memanggil same-origin `/api/gateway/*`. Gateway allowlist, method, origin mutasi, UUID/schema, permission exact-match dan refresh/retry existing dipertahankan. Backend tetap wajib memvalidasi izin/scope.

`docs/core-preservation.json` mencatat 25 file core byte-identical dengan input pengguna. Perubahan pada UsersPage adalah presentasi + state konfirmasi UI; adapter payload/query, mutation dan validasi dipertahankan.

## Presentasi
- `globals.css`: tokens, layout, base controls/cards/table/dialog, system dark mode, responsive/reduced motion.
- Sidebar 290/90px di desktop; drawer di bawah 1280px, focus trap dan inert content.
- Employees masih native form inline. `ConfirmDialog` Radix mengganti native confirm untuk disable.
- Dashboard opsional view model saja, route tidak memasok data operasional.
- Planned modules tetap disembunyikan; tidak ada Pro/demo data/locale routing dari template.

## Batas
Refresh cache masih Map proses tunggal, tidak distributed. BFF refresh tidak otomatis menyelesaikan persistensi token JWT antarinstance. UI referensi UUID manual, Employees metadata pagination belum diterapkan. Lihat PRD tahap 2/3 dan SECURITY.
