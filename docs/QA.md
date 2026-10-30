# QA — v1.3.0 TailAdmin Free Adaptation

Tanggal: 26 Oktober 2026. Tidak ada login atau mutasi ke backend live oleh pembuat redesign.

| Pemeriksaan | Hasil | Batas |
| --- | --- | --- |
| `npm run typecheck` | Lulus | Kecocokan TS, bukan kontrak live |
| `npm test` | 12/12 lulus | Input assertion terisolasi |
| `npm run build` | Lulus | Kompilasi bukan production security review |
| `npm run test:smoke` | 7 kelompok lulus | Next asli, TANPA authenticated login/CRUD |
| Protected UI harness | 10 kelompok lulus | Session/input sintetis di luar proyek output, bukan live auth |
| Preservasi core | 25 file byte-identical | Dibandingkan ZIP HSSE pengguna, bukan penilaian keamanan |

## Unit tests
- `schema.test.ts`: 4 kelompok employee create/update, `/me`, login/assignment.
- `real-only.test.ts`: 6 kelompok no-interception/no-seed, unknown-vs-zero dashboard, nontransactional shell, exact permission navigation.
- `redesign.test.ts`: 2 kelompok badge backend status dan fondasi tema/keyboard/license/env.

Tidak menghapus assertion keamanan demi redesign. Data input pengujian bukan sumber data aplikasi.

## Browser smoke aplikasi asli
`tests/smoke.mjs` menjalankan Next lokal dan Chromium: login tanpa demo, tidak ada worker baru, worker lama 404, route protected redirect, gateway Employees tanpa sesi 401, endpoint dashboard tak disepakati 404, login tidak overflow 1440/1280/768/390, tidak ada external request/runtime error dalam skenario. Hasil: `qa-real-only-smoke.json`.

## Visual/interaksi komponen terlindungi
Harness disposable di luar folder aplikasi memuat komponen aktual dan CSS output, dengan React SessionProvider berisi profil QA sintetis dan query cache berisi input uji/empty/error. Adapter list di harness ditahan untuk skenario loading; bukan fake API atau auth bypass yang ditambahkan ke Next. Harness serta input sintetis **tidak dimasukkan ke ZIP/runtime**.

Yang diuji: dashboard/Employees empty/populated pada 1440/1280/768/390; create form; dialog disable dan cancel tanpa mutation; profil; drawer lock background + Escape; error/loading/denied/forbidden/pending; desktop collapse 90px; system dark render. Hasil ringkas: `qa-isolated-ui.json`.

Screenshot diperiksa satu per satu. Temuan empty state tersembunyi akibat berada di dalam tabel lebar telah diperbaiki dengan meletakkannya di luar scroll region; hasil pengganti diperiksa ulang. Target sentuh/header, label logout saat collapse, dan kontras input/destructive dark dirapikan. Tabel lebar sengaja scroll di region sendiri, bukan seluruh halaman. Grid dekoratif login berasal aset template, bukan visualisasi data.

## Yang BELUM terbukti
- Login/refresh/logout live dan token rotation server.
- CRUD live, permission revocation dan backend scope/IDOR.
- Flow pending/disabled/password change, seluruh keyboard/screen reader/WCAG.
- Multi-instance concurrency, pentest, deployment readiness dan audit dependency baru.

Snapshot `audit-production.json` dibawa sebagai histori, tidak boleh diberi label audit baru versi ini.

## Ulangi lokal
`npm ci` → `npm run typecheck` → `npm test` → `npm run build` → `npx playwright install chromium` → `npm run test:smoke`. Jalankan berurutan. Authenticated regression memerlukan akun/data uji dan persetujuan terpisah.
