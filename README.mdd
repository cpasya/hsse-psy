# HSSE Dashboard — v1.3.0 TailAdmin Free Adaptation.

## Mulai menjalankan

Prasyarat: Node.js 20 LTS atau versi kompatibel, npm, akses jaringan ke backend. Pengujian pembuat paket memakai Node 24. Tidak memerlukan akun demo atau service worker.

```bash
npm ci
cp .env.example .env.local
openssl rand -base64 32
```

Tempel hasil perintah terakhir sebagai `NEXTAUTH_SECRET` di `.env.local` (jangan kirim ke chat atau commit). Konfigurasinya hanya:

```dotenv
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=REPLACE_WITH_RANDOM_SECRET_AT_LEAST_32_CHARS
API_BASE_URL=https://backend-hsse.riyanwarsetiadi0605.workers.dev/api/v1
```

```bash
npm run dev
```

Buka `http://localhost:3000/login`, gunakan akun backend milik organisasi. Jangan memakai password/token contoh dari chat. Port berbeda → sesuaikan `NEXTAUTH_URL`, lalu restart. Origin mutasi diperiksa oleh gateway.

## Migrasi dari proyek sebelumnya

1. Ekstrak ZIP ke **folder baru**, jangan ditimpa di atas proyek lama.
2. Salin konfigurasi `.env.local` secara lokal; sesuaikan tiga variabel di atas.
3. Hapus `HSSE_FRONTEND_ROLE_MAP` jika masih ada; kode memakai permissions dari `/me`.
4. Jalankan `npm ci`, kemudian server. Logout/login ulang untuk memvalidasi sesi baru.
5. Jika browser pernah menjalankan versi MSW lama, unregister hanya worker lama pada origin aplikasi itu di DevTools → Application → Service Workers. Tutup tab origin itu dan muat ulang. Versi ini tidak mendaftarkan worker.

## Yang sudah tersedia

- NextAuth Credentials → backend nyata, refresh/logout, profil `/me`, permission exact-match.
- Master User: list/search/filter, tambah, edit, nonaktifkan sesuai permission.
- Sidebar/topbar, split login, tabel, form, badge, konfirmasi Radix, profile dialog.
- Tema TailAdmin Free: biru-indigo, surface putih, border halus, sidebar 290/90px, mobile drawer. Mode gelap otomatis mengikuti preferensi sistem; tidak ada tombol tema tersimpan.
- Dashboard dan modul belum terintegrasi tetap wadah tanpa angka/record buatan.

**Belum:** dropdown referensi dari API (tahap 2), pagination metadata sebenarnya, UI manajemen roles/permissions, modul operasional, forced password change, distributed session hardening, dan release production. Lihat `PRD.md`.

## Pemeriksaan

Jalankan berurutan (build/smoke memakai `.next`):

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:smoke
```

`CHROMIUM_PATH` opsional bila memakai Chromium sistem. Tes dalam `tests/` memakai input assertion terisolasi, bukan sumber data runtime. Smoke tidak login atau melakukan CRUD backend live.

## Peta dokumen

- `handoff.md`: status aktual, bukti, file penting, instruksi AI berikutnya.
- `PRD.md`: blueprint produk, acceptance criteria, backlog dan urutan kerja.
- `REDESIGN-REPORT.md`: audit dua ZIP, perubahan dan batas redesign.
- `docs/QA.md`: cakupan hasil tes, termasuk batas visual QA terisolasi.
- `docs/ARCHITECTURE.md`, `docs/BACKEND-INTEGRATION.md`, `docs/SECURITY.md`.
- `THIRD-PARTY-NOTICES.md`, `licenses/TailAdmin-MIT.txt`.

**Bukan production-ready.** Stack utama sengaja tidak di-upgrade major. Catatan audit dependency historis bukan hasil audit baru; keamanan dan live regression tetap wajib sebelum release.
