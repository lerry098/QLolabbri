# Nusa Corporate

Aplikasi perusahaan independen yang dibangun dari referensi lokal. Beranda menggunakan komponen React, bukan screenshot dengan area klik. Susunan header, hero, formulir, registrasi, tracking, carousel, dan footer mengikuti referensi desktop/ponsel. Identitas resmi bank diganti dengan Nusa Corporate sesuai persyaratan merek independen.

## Menjalankan di Windows

Gunakan Node.js 22.12+ atau 24 LTS. Dari direktori proyek:

```powershell
cd C:\Users\SAMUEL\Downloads\qlolabbri-visual-review
npm.cmd ci --cache .npm-cache
npm.cmd run dev
```

Buka **http://127.0.0.1:4173**. React/Vite dan API Express berjalan pada origin yang sama. Hentikan pratinjau lama apabila port 4173 sedang digunakan.

Akun khusus prototipe lokal:

- Corporate ID: `JarwoCorp`
- User ID: `jarwo`
- Kata sandi: `jarwo123!`

Gunakan akun aplikasi ini saja. Tidak ada integrasi autentikasi atau pengiriman data ke sistem bank. Kata sandi tidak disimpan di localStorage/sessionStorage.

## Fitur yang tersedia

- Menu dengan navigasi SPA, scroll bagian beranda, indikator aktif, Escape, perangkap fokus, dan penutupan saat klik di luar.
- Login tervalidasi, tampil/sembunyi kata sandi, sesi HttpOnly, dashboard terlindungi, kedaluwarsa sesi 30 menit, logout. Login yang berhasil selalu membuka Dashboard.
- Menu Registrasi Online membuka formulir Cash Management setelah pengguna masuk. Registrasi Cash Management dan Giro mencakup validasi bersama frontend/backend, persetujuan, penyimpanan, nomor referensi unik, dan konfirmasi.
- Tracking dan status Giro: pencarian catatan milik pengguna, riwayat status aktual, timestamp, pencarian tidak ditemukan, reset. Menu Status Registrasi Giro tersedia di navigasi dan Dashboard; masukkan referensi Giro lalu pilih Cek Status untuk memuat status terbaru. Tautan pengajuan Giro di Dashboard juga membuka pengecekan status secara langsung.
- Empat artikel orisinal, kontrol carousel, pagination, detail artikel, artikel terkait, dan placeholder stabil pada beranda yang mempertahankan ruang gambar referensi.
- Dashboard dengan profil, ringkasan pengajuan, aktivitas, dan notifikasi dari catatan akun yang sedang masuk.
- Pusat Bantuan, Kebijakan Privasi, tujuan kontak internal aplikasi, dan permintaan bantuan pemulihan akun.
- Responsif, label input, pesan validasi, navigasi keyboard, fokus terlihat, dan penanganan kegagalan jaringan/server.

## Penyimpanan lokal dan Supabase

**Default adalah adapter prototipe lokal yang eksplisit**, bukan koneksi Supabase yang sudah dikonfigurasi. API Express benar-benar berjalan. Catatan akun, pengajuan, berita, dan permintaan bantuan disimpan ke `.data/nusa.json` di folder proyek ini; registrasi tetap tersedia setelah server dimulai ulang. Sesi lokal menggunakan memori server dan berakhir setelah restart.

Untuk memakai Supabase:

1. Buat project Supabase khusus untuk Qlolabbri. Jika secret key pernah dibagikan, rotasi/revoke key tersebut di dashboard sebelum menggunakannya.
2. Salin project URL dan **secret API key** dari Supabase. Backend memakai `@supabase/server` untuk membuat client admin yang mengakses Supabase Data API; tidak memakai driver atau connection string PostgreSQL langsung.
3. Salin `.env.example` menjadi `.env`, lalu isi `SUPABASE_URL` dan `SUPABASE_SECRET_KEY`. Secret key hanya boleh berada di backend dan secret manager; jangan masukkan ke React/browser, jangan commit `.env`, dan jangan kirim nilainya melalui chat. `SUPABASE_PUBLISHABLE_KEY` dan `SUPABASE_JWKS_URL` tidak diperlukan karena login Qlolabbri yang ada tetap dipakai.
4. Di Supabase Dashboard, buka **SQL Editor**, lalu jalankan isi `database/schema.sql` untuk membuat tabel, RLS, hak akses server, dan fungsi transaksi `create_application`. Skrip dapat dijalankan ulang; kolom kedaluwarsa sesi lama diperbarui menjadi timestamp dengan zona waktu.
5. Jalankan `npm.cmd run db:check` untuk memverifikasi koneksi, delapan tabel beserta kolom yang dipakai aplikasi, dan ketersediaan RPC tanpa mengubah data. Jika tabel atau fungsi belum tersedia, jalankan langkah SQL di atas terlebih dahulu.
6. Opsional: isi `SEED_CORPORATE_ID` (harus diawali `NUSA-`), `SEED_USER_ID`, `SEED_EMAIL`, `SEED_NAME`, dan `SEED_PASSWORD` (minimal 12 karakter) untuk membuat akun awal. Lalu jalankan `npm.cmd run db:seed` untuk mengisi berita dan akun awal. Skrip ini tidak membuat/mengubah skema. Akun dan data prototipe di `.data/nusa.json` tidak disalin otomatis ke Supabase.
7. Jalankan aplikasi. Bila kedua variabel `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` diatur, penyimpanan data dan sesi menggunakan Supabase API. Jika koneksi gagal, aplikasi menampilkan error—tidak beralih diam-diam ke penyimpanan lokal.

Skema: `database/schema.sql`. Tabel: `users`, `applications`, `corporate_registrations`, `giro_registrations`, `tracking_events`, `news`, `recovery_requests`, `sessions`. Penyimpanan pengajuan dan event memakai RPC Supabase `create_application` supaya tetap atomik. Query data privat tetap difilter menurut pemilik akun. RLS diaktifkan; backend memakai secret key yang melewati RLS, sehingga key tersebut tidak boleh pernah dikirim ke browser. Supabase menyimpan datanya di PostgreSQL, tetapi aplikasi berkomunikasi lewat Supabase API, bukan driver PostgreSQL.

## Produksi

```powershell
npm.cmd run build
npm.cmd start
```

Server produksi menolak startup tanpa `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SESSION_SECRET` acak minimal 32 karakter, serta `APP_ORIGIN` berawalan HTTPS. Sajikan melalui reverse proxy TLS. Aktifkan `TRUST_PROXY=1` hanya jika satu reverse proxy tepercaya berada di depan server. API produksi menolak koneksi non-HTTPS. `tsx` merupakan dependensi runtime, sehingga `npm ci --omit=dev` dapat digunakan sesudah build pada proses deployment terpisah.

Autentikasi menggunakan hash scrypt dengan salt acak, regenerasi sesi saat login, cookie HttpOnly/Secure pada produksi/SameSite Strict, CSRF berbasis sesi, pemeriksaan Origin, pembatasan percobaan login, serta error autentikasi generik. Endpoint privat tidak mengungkap apakah nomor referensi milik akun lain ada.

## Konfigurasi yang masih diperlukan

- Akun organisasi, secret sesi, HTTPS, dan kebijakan backup/retensi operator untuk instalasi produksi. Koneksi Supabase nyata, sesi login, penyimpanan pengajuan, dan tracking sudah diuji; rincian ada di [docs/TEST-RESULTS.md](docs/TEST-RESULTS.md).
- Pemulihan kata sandi saat ini **mencatat permintaan bantuan administrator**, memberikan respons generik, dan tidak mengirim email atau mengubah kata sandi. SMTP, token reset email yang kedaluwarsa, serta alur penggantian kata sandi mandiri belum disediakan.
- Proses operator untuk meninjau dan mengubah status pengajuan. Status tidak berubah otomatis atau disimulasikan berdasarkan waktu. Jika mengembangkan alat operator, perbarui status/timestamp dan tambahkan tracking event dalam satu transaksi.
- Alamat kantor, nomor telepon, dan email organisasi. Footer mengarah ke bantuan internal sampai pengelola mengonfigurasi tujuan kontak miliknya.
- Portal ini tidak membuka rekening, memindahkan dana, atau menyediakan integrasi layanan bank.

## Pengujian

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
# Atau seluruh pemeriksaan:
npm.cmd run verify
```

Playwright menggunakan Chrome yang sudah terpasang di `C:/Program Files/Google/Chrome/Application/chrome.exe`. Set `CHROME_PATH` bila lokasinya berbeda. Pengujian browser menyalakan server sendiri pada port 4185 dan menggunakan `.data/e2e.json` yang terpisah dari catatan lokal pengguna. Mode pengujian menaikkan batas request agar skenario otomatis tidak saling menghalangi; batas login produksi diuji tersendiri pada suite API.

Laporan dan batas verifikasi: [docs/TEST-RESULTS.md](docs/TEST-RESULTS.md). Tangkapan hasil browser: `artifacts/app-desktop.png`, `artifacts/app-tablet.png`, `artifacts/app-mobile.png`.

## Struktur

```text
src/components/       Header, footer, merek, formulir login
src/pages/            Beranda dan seluruh halaman lanjutan
src/api.ts            Adapter HTTP, CSRF, dan error terstruktur
src/auth.tsx          Context sesi dan proteksi route
shared/               Model TypeScript dan skema Zod
server/               Express, sesi, store lokal/PostgreSQL, migrasi
app-public/assets/    Aset statis aplikasi
 database/schema.sql  Relasi, indeks, dan pembatasan akses database
 tests/               Unit, API/integrasi, komponen, dan Playwright
```

## Referensi visual asli

Berkas screenshot di `public/references`, paket `design-stitch`, dan server pratinjau awal tetap tersedia. `npm.cmd run preview:legacy` menjalankan pratinjau gambar lama; jalankan terpisah dari aplikasi baru. Dokumentasi sebelumnya disimpan di [docs/LEGACY-README.md](docs/LEGACY-README.md). Screenshot referensi dan laporan sumber tidak disertakan dalam build aplikasi. Proyek RasaLokal/RasaLokal-Admin tidak diedit.

`hero.jpg`, `footer.jpg`, `cash.png`, dan `tracking.png` disalin dari aset publik yang tercatat pada laporan referensi yang sudah tersedia. `giro.svg`, `nusa-mark.svg`, dan `news.svg` dibuat sebagai aset vektor aplikasi independen. Tidak ada skrip formulir, endpoint pengumpulan kredensial, atau API bank dari halaman sumber yang diintegrasikan. Font Plus Jakarta Sans di-host lokal melalui paket Fontsource.
