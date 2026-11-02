# Security — v1.3.0, BELUM PRODUCTION-READY

## Preservasi
Auth/BFF/session/permission logic berasal dari source pengguna dan dipertahankan. Tidak membawa demo account, interception provider, worker, seed database atau browser data fallback. JSON session browser tidak seharusnya mengandung access/refresh token; wajib verifikasi ulang dalam live QA.

Permission berasal `/me`, bukan `HSSE_FRONTEND_ROLE_MAP`. UI tidak boleh menambah grant berdasarkan nama Admin/UUID role. Missing/failed profile harus fail-closed; backend selalu menegakkan permission dan scope tiap request.

## Blocker / pekerjaan belum selesai
- Stack memakai Next.js 15.5.28 / React18 / NextAuth4 / Zod 4.6.7. Audit production dependency 2 November 2026 melaporkan 0 vulnerability. `audit-production.json` adalah **snapshot historis**, bukan hasil audit terbaru.
- Refresh Map/recent cache per proses, bukan distributed coordination. Persistensi token refresh/JWT cookie pada BFF, race paralel antarinstance, revocation dan lifecycle perlu review.
- Authenticated live regression, permission revocation/status change, scope/IDOR dan backend authz belum diuji pembuat redesign.
- `mustachePassword`, pending onboarding dan change-password endpoint/flow belum disepakati penuh.
- Rate limiting, MFA sesuai kebutuhan organisasi, durable audit log, TLS/host/cookie/CSP deployment review, monitoring, backup/recovery dan pentest masih perlu.

## Operasional
Jangan commit .env.local, token, password, cookie atau private key. Jangan memakai kredensial lama dari chat. Token yang pernah dibagikan harus dicabut/dirotasi oleh pemiliknya. Gunakan secret kuat, HTTPS di deployment, origin yang benar dan akun uji terpisah untuk QA. Jangan publish production sebelum review/remediasi blocker.

Sidebar/dialog keyboard handling dan focus states bukan sertifikasi WCAG. Perlu audit aksesibilitas menyeluruh terpisah.
