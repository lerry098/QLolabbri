# Spesifikasi desain

## Ruang lingkup dan sumber

Sumber yang diperiksa adalah `../README.md`, `../public/index.html`, `../public/styles.css`, `../server.mjs`, serta gambar lokal `../artifacts/review-desktop.png` dan `../artifacts/review-mobile.png`. Tidak diperlukan akses situs referensi atau pengambilan ulang gambar jaringan.

Aplikasi lokal menyajikan satu gambar responsif melalui elemen `picture`, bukan halaman dengan komponen UI aktif. Sumber desktop acuan memiliki lebar 1440px, ponsel 390px. Breakpoint pada HTML adalah `max-width: 600px`. Lebar acuan tersebut adalah ukuran layout; dimensi PNG hasil generasi dicatat terpisah di `manifest.json` dan dapat berbeda.

Paket ini merupakan adaptasi konseptual untuk membangun kembali susunan halaman sebagai elemen desain yang bisa diedit di Stitch. Paket tidak mengubah aplikasi awal.

| Bagian pada referensi | Bagian dalam paket desain |
| --- | --- |
| Header identitas dan menu | Identitas generik PORTAL DEMO, badge DEMO DESAIN, menu |
| Hero biru dengan formulir login bermerek bank | Hero biru orisinal dan kartu demonstrasi tanpa kolom kredensial |
| Registrasi Online / dua layanan | Layanan Perusahaan / Manajemen Bisnis dan Administrasi Usaha |
| Tracking | Tracking Pengajuan informatif |
| Berita Terkini, banner gagal dimuat | Tiga kartu berita dengan ilustrasi dan judul contoh baru |
| Footer identitas/kontak lembaga | Footer demo dengan identitas generik dan hello@example.com |

Tidak ada desain dashboard, rekening, transfer, OTP, atau alur registrasi lanjutan karena bagian tersebut tidak terdapat di aplikasi lokal yang ditinjau.

## Warna

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| Primary | `#187AC5` | Tombol, link, panah |
| Deep blue | `#124B85` | Hero, footer, penekanan |
| Cyan | `#65C9E9` | Gelombang dan ilustrasi |
| Accent | `#F78B35` | Garis dan badge demonstrasi |
| Background | `#FFFFFF` | Latar dan kartu |
| Ink | `#172B46` | Judul dan teks utama |
| Muted | `#64748B` | Deskripsi |
| Border | `#DFE8F1` | Garis dan bingkai kartu |

Teks putih ditempatkan pada biru gelap. Pada area sian terang gunakan teks biru gelap. Oranye digunakan sebagai aksen, bukan untuk teks isi kecil pada putih.

## Tipografi dan ukuran layout

Font acuan: Plus Jakarta Sans atau sans serif dengan bentuk serupa. Judul tebal 700–800, isi 400–500, tombol 600–700.

| Elemen | Desktop | Ponsel |
| --- | --- | --- |
| Lebar acuan | 1440px | 390px |
| Maksimum konten | 1368px, terpusat | Lebar layar dikurangi 32px |
| Margin luar | 32–36px | 16px |
| Header | Sekitar 72px | Sekitar 64px; sesuai kebutuhan isi |
| Judul hero | 48–56px / 1.15 | Sekitar 32px / 1.2 |
| Judul section | 32–40px / 1.2 | 28px / 1.3 |
| Judul kartu | 24–28px / 1.3 | 24px / 1.3 |
| Isi | 16–18px / 1.6 | Sekitar 16px / 1.6 |
| Tombol | Tinggi minimal 44px | Tinggi minimal 44px; full width pada kartu |
| Radius kartu | 16px | 16px |
| Radius tombol | 8px | 8px |
| Padding kartu | 32–40px | 20–24px |

## Komponen dan susunan

1. **Header:** identitas di kiri, badge demo dan menu di kanan. Subjudul identitas boleh disembunyikan di layar sempit.
2. **Hero:** gelombang biru orisinal, judul kiri dan kartu demo kanan; berubah menjadi satu kolom pada ponsel. Kartu demo memiliki aksen oranye, ilustrasi browser, teks dan satu tombol.
3. **Layanan:** section berbingkai, judul dan deskripsi, dua kartu; satu kolom pada ponsel. Manajemen Bisnis menggunakan ilustrasi laptop; Administrasi Usaha menggunakan folder, checklist, tas kerja.
4. **Tracking:** gambar kiri dan teks kanan pada desktop; gambar di atas teks pada ponsel.
5. **Berita:** tiga kartu desktop, satu kartu pada ponsel, panah dan indikator halaman. Kartu berita menggunakan konten contoh baru; sumber referensi tidak menyediakan banner yang berhasil dimuat.
6. **Footer:** tiga kolom desktop dan satu kolom ponsel. Identitas generik, kontak contoh, bantuan, pemberitahuan demo dan copyright.

Breakpoints: ponsel sampai 600px; desktop di atasnya dengan transisi grid yang tetap nyaman pada tablet. Pada kisaran 601–1023px, grid boleh menjadi satu kolom bila teks atau kartu terlalu sempit. Tidak ada pemotongan teks untuk mempertahankan bentuk screenshot.

## Konten utama yang mengikat

- Identitas: **PORTAL DEMO**; descriptor: **Portal Perusahaan**.
- Badge: **DEMO DESAIN**.
- Hero: **Satu portal. Seluruh kebutuhan bisnis Anda.**
- Deskripsi hero: **Kelola layanan dan pantau pengajuan dalam satu tampilan.**
- Kartu demo: **Jelajahi tampilan demo**; **Lihat susunan layanan dan informasi perusahaan.**; tombol **Lihat demo**; catatan **Tanpa akun atau data pribadi**.
- Section layanan: **Layanan Perusahaan**; **Temukan layanan untuk mendukung kegiatan bisnis Anda.**
- Layanan pertama: **Manajemen Bisnis**; **Pantau informasi dan kegiatan usaha dalam satu tampilan yang terstruktur.**; tombol **Lihat layanan**.
- Layanan kedua: **Administrasi Usaha**; **Temukan informasi persyaratan dan tahapan pengajuan layanan perusahaan.**; tombol **Informasi layanan** dan **Status pengajuan**.
- Tracking: **Tracking Pengajuan**; **Ketahui informasi dan perkembangan pengajuan layanan perusahaan Anda.**; tombol **Lihat tracking**.
- Berita: **Berita Terkini**; **Informasi dan kegiatan terbaru untuk pengembangan bisnis Anda.**
- Judul berita contoh: **Panduan pengelolaan usaha**; **Agenda komunitas bisnis**; **Kenali alur pengajuan**.
- Footer: **Konsep portal layanan perusahaan.**; **HUBUNGI KAMI**; **hello@example.com**; **Kontak demonstrasi**; **BANTUAN**; **Pusat bantuan**; **Kebijakan privasi**.
- Pemberitahuan: **DEMO DESAIN — identitas dan konten fiktif.**
- Copyright: **© 2026 PORTAL DEMO**.

## Batas artefak dan pemeriksaan

Gambar dibuat menggunakan tool bawaan `imagegen`, mode `ui-mockup`, dengan prompt tersimpan di folder `prompts/`. Ini gambar konseptual dengan kemungkinan perbedaan kecil pada tata letak, ukuran atau ejaan. Spesifikasi teks dan prompt Stitch menjadi acuan jika ada perbedaan. Kontrol yang digambar menyampaikan bentuk visual, bukan fungsi yang telah diimplementasikan.

Paket akhir diperiksa untuk jumlah enam PNG, signature/dimensi PNG, keberadaan enam prompt gambar, dokumen pendamping, manifest dan kelengkapan ZIP. Source pratinjau awal tidak diedit; pemeriksaan aplikasi awal berada di luar perubahan paket desain ini.
