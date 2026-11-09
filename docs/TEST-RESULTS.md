# Hasil pengujian

Pembaruan integrasi Supabase: 9 November 2026 (Asia/Jakarta). Pemeriksaan visual awal: 5 November 2026. Lingkungan: Windows, Node.js 24.14.0, Chrome headless yang sudah terpasang.

## Pemeriksaan yang dijalankan

| Pemeriksaan                        | Hasil             |
| ---------------------------------- | ----------------- |
| TypeScript dan build produksi Vite | Lulus             |
| Vitest: validasi bersama           | 9 lulus           |
| Vitest/Supertest: API dan keamanan | 14 lulus          |
| React Testing Library: komponen    | 4 lulus           |
| Vitest: Supabase dan sesi Jakarta  | 3 lulus           |
| Supabase nyata: tabel dan RPC      | Lulus             |
| Playwright: alur browser           | 17 skenario lulus |

Build mengeluarkan peringatan anotasi komentar dari dependensi Zod; bundle tetap berhasil dibuat. Ini bukan error aplikasi.

Regresi navigasi memastikan login selalu membuka Dashboard, termasuk saat memakai tautan `returnTo` registrasi yang lama. Menu Registrasi Online membuka formulir Cash Management untuk pengguna yang sudah masuk; ketika belum masuk, pengguna diarahkan ke halaman login. Formulir tidak tampil otomatis setelah login.

Menu Status Registrasi Giro tersedia di navigasi utama dan Dashboard. Referensi khusus Giro dinormalisasi, pencarian disinkronkan dengan URL dan riwayat browser, serta Reset menghapus referensi dari URL. Pencarian ulang memuat status terbaru; jika pemuatan gagal, hasil lama disembunyikan. Tautan pengajuan Giro pada Dashboard langsung membuka halaman status dengan referensi yang sesuai.

## Verifikasi Supabase nyata

`npm.cmd run db:check` berhasil memeriksa delapan tabel beserta kolom yang digunakan aplikasi dan metadata RPC `create_application`. Pemeriksaan ini hanya membaca skema dan tidak mengambil isi catatan. `npm.cmd run db:seed` berhasil memasang empat artikel awal. Server pada port 4173 dimulai ulang dan melaporkan `Persistence: Supabase Data API`.

Pengujian melalui API server yang berjalan menggunakan akun sementara dengan password acak: login, pemulihan sesi pada permintaan berikutnya, penyimpanan sesi dengan waktu kedaluwarsa yang valid, registrasi Corporate dan Giro melalui RPC, event tracking, pembacaan dashboard, serta logout berhasil. Akun sementara beserta pengajuan, event, dan sesinya dihapus setelah pengujian.

Akun lokal `JarwoCorp` / `jarwo` kemudian disalin secara khusus ke `public.users` Supabase dengan UUID baru, hash kata sandi dan role semula tetap dipertahankan. Login Jarwo, pemulihan sesi, akses dashboard, dan logout melalui API server yang berjalan berhasil diuji. Akun lain dan data pengajuan lokal tidak dipindahkan otomatis.

Kolom `sessions.expire` sekarang memakai `timestamptz(6)`. Skrip skema juga memuat migrasi berjaga untuk kolom lama. Regresi unit memeriksa respons dengan offset UTC maupun format lama tanpa offset di zona waktu Jakarta, termasuk penghapusan tepat saat sesi kedaluwarsa. Migrasi dari kolom lama belum diuji pada database nyata.

`.env` diabaikan Git dan nilai secret key dipastikan tidak ada dalam hasil build frontend. Server Playwright mengosongkan variabel Supabase secara eksplisit sehingga pengujian browser tetap memakai `.data/e2e.json` lokal meskipun `.env` sudah dikonfigurasi.

## Cakupan alur permintaan

| #   | Alur                   | Verifikasi                                                                                            |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Beranda dirender       | Heading/section/form HTML nyata, tiga input, aset lokal berhasil dimuat, tidak ada screenshot overlay |
| 2   | Menu buka/tutup        | Klik tombol, Escape, klik backdrop, fokus kembali                                                     |
| 3   | Navigasi menu          | Scroll hash, menu menutup, tujuan aktif                                                               |
| 4   | Input login            | Corporate ID, User ID, kata sandi menerima input                                                      |
| 5   | Visibilitas kata sandi | Masking awal dan toggle dua arah                                                                      |
| 6   | Login kosong           | Tombol dinonaktifkan; validasi backend menolak payload kosong                                         |
| 7   | Login salah            | Error generik ditampilkan                                                                             |
| 8   | Dashboard              | Redirect saat anonim; login selalu menuju Dashboard; sesi tetap berlaku setelah reload                |
| 9   | Lupa kata sandi        | Route, validasi email, permintaan tersimpan, respons generik, kembali ke login                        |
| 10  | Cash Management        | Menu Registrasi Online dan tombol Buat Akun membuka form corporate setelah pengguna masuk             |
| 11  | Validasi corporate     | Form kosong dan persetujuan tidak valid ditolak                                                       |
| 12  | Referensi registrasi   | Referensi unik dibuat; record terbaca kembali sesudah store dibuka ulang                              |
| 13  | Registrasi Giro        | Route, form, produk, dan penyimpanan berhasil                                                         |
| 14  | Status Giro            | Menu status, referensi Giro, pembaruan status, reset URL, navigasi riwayat, dan penanganan hasil lama |
| 15  | Tracking beranda       | Tombol membuka route tracking                                                                         |
| 16  | Tracking berwenang     | Record pemilik ditemukan; pemilik berbeda tidak terlihat; timeline/tanggal ditampilkan                |
| 17  | Carousel sebelumnya    | Indeks/pagination berubah                                                                             |
| 18  | Carousel berikutnya    | Indeks/pagination berubah                                                                             |
| 19  | Pagination             | Dot dapat dipilih langsung                                                                            |
| 20  | Detail berita          | Judul, cover, artikel, related links, kembali ke berita                                               |
| 21  | Footer                 | Bantuan, privasi, kontak aplikasi membuka tujuan yang tepat                                           |
| 22  | Logout                 | Dashboard/API tidak dapat diakses dengan sesi yang telah dihentikan                                   |
| 23  | Desktop                | Hero x=36, y=97, w=1368, h=692 pada viewport 1440; kartu login w=400, x=904; screenshot diperiksa     |
| 24  | Tablet                 | Lebar 768 dan 1024 tanpa horizontal overflow; screenshot tablet                                       |
| 25  | Ponsel                 | Lebar 320, 390, 600 tanpa horizontal overflow; halaman lanjutan diperiksa pada 320                    |

Pemeriksaan tambahan meliputi CSRF, Origin asing, cookie HttpOnly/SameSite, rotasi sesi/token, hash scrypt, kedaluwarsa sesi absolut, batas 10 percobaan login, format JSON salah, validasi format referensi, respons akun tidak ditemukan yang generik, error pemuatan berita dengan retry, dan penanganan 401 pada tracking.

## Artefak

- `artifacts/e2e-results.json`: laporan Playwright.
- `artifacts/app-desktop.png`: tangkapan 1440 × 1000, full page.
- `artifacts/app-tablet.png`: tangkapan 768 × 844, full page.
- `artifacts/app-mobile.png`: tangkapan 390 × 844, full page.
- `public/references/reference-proxy-desktop.png` dan `reference-proxy-mobile.png`: referensi asli yang dipertahankan.

## Batas verifikasi

Suite otomatis menggunakan API Express dan adapter file lokal; pemeriksaan Supabase nyata dijalankan terpisah sebagaimana dijelaskan di atas. Reverse proxy TLS dan pengiriman email belum diuji. Pemulihan hanya mencatat permintaan bantuan administrator, bukan reset kata sandi mandiri.

Pemeriksaan visual menggunakan screenshot dan ukuran elemen utama, bukan ambang pixel-diff otomatis. Kesamaan setiap piksel tidak diklaim: merek/kontak bank diganti sesuai persyaratan aplikasi independen, ilustrasi kartu memakai merek Nusa, dan font menggunakan Plus Jakarta Sans yang di-host lokal. Screenshot referensi tidak dimodifikasi.

Pemeriksaan aksesibilitas mencakup label, validasi, keyboard, focus trap, focus restore, dan fokus terlihat. Audit WCAG 2.2 AA menyeluruh, pengujian screen reader nyata, dan pemeriksaan lintas Firefox/Safari belum dilakukan.
