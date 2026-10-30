# Backend Integration — v1.3.0

Redesign tidak menambah endpoint atau mengubah logic adapter dari ZIP HSSE input. Kontrak berikut berasal dari source/konfirmasi sebelumnya; Swagger live tidak diperiksa ulang pada pekerjaan UI ini.

Base: `API_BASE_URL=https://backend-hsse.riyanwarsetiadi0605.workers.dev/api/v1`.

| Area | Implementasi aktual |
| --- | --- |
| Login | POST auth/sign-in/email server, Zod, dilanjutkan /me |
| Refresh/logout | Bearer refresh token server ke auth/refresh dan auth/sign-out |
| Me | Profil active + permissions required, fail-closed; bukan role map env |
| Employees | GET/POST dan UUID GET/PATCH/DELETE; disable session backend menurut kontrak |
| Referensi | Gateway allowlist read roles/permissions/departments/locations + detail; belum semua typed picker adapter |
| Assignment | Helper PUT roles/:id/permissions; replace-all, UI belum tersedia |
| Operasional | Belum ada adapter/kontrak modul; tidak membuat endpoint tebakan |

Browser tidak memperoleh access/refresh token lewat session JSON. Gateway same-origin meneruskan request yang diizinkan dan memeriksa permission. Backend otoritas akhir scope dan authorization.

## Hal yang sengaja belum diubah
- Employees list parser menerima array atau satu envelope `data` setelah HTTP wrapper; butuh respons aktual jika server mengubah format.
- Metadata pagination belum dipakai; next menggunakan panjang hasil page size 20.
- Helper roles/permissions halaman pertama limit 100 bukan katalog lengkap.
- UUID referensi manual, `jobPositionId` tidak membuktikan endpoint job position master.
- Pending/disabled/forced-password-change belum memiliki flow khusus lengkap.

## Tahap 2
Minta contoh list roles/departments/locations, query dan metadata yang disanitasi. Definisikan schema, adapter, query berizin, loading/error/empty dan existing selection. Jangan menghapus assignment lama saat opsi belum tersedia. Tidak perlu membuka token ke browser. Lihat acceptance criteria di PRD.

## Uji live berikutnya (memerlukan izin dan akun uji)
Login → /me → read Employees/referensi → create/PATCH/disable hanya pada data uji yang disetujui → expiry/refresh/logout → permission/status dicabut. Catat setiap hasil; jangan menganggap QA visual sintetis sebagai hasil tersebut.
