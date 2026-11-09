# Prompt Stitch — enam tahap

Salin aturan global sekali pada awal proyek. Setelah itu, gunakan prompt tahap bernomor bersama gambar dengan nomor yang sama. Ketiga gambar desktop merupakan potongan berurutan dari **satu halaman**. Ketiga gambar ponsel menunjukkan adaptasi responsif halaman tersebut.

## Aturan global — salin terlebih dahulu

```text
Buat desain satu halaman portal perusahaan berbahasa Indonesia dengan identitas generik PORTAL DEMO. Gunakan enam gambar terlampir sebagai referensi visual untuk bagian halaman dan versi responsifnya. Seluruh konten adalah demonstrasi.

Urutan halaman: header, hero dengan kartu demonstrasi, layanan perusahaan dengan dua kartu, tracking pengajuan, berita terkini, footer.

Gunakan satu design system yang konsisten: warna utama #187AC5, biru gelap #124B85, sian #65C9E9, aksen oranye #F78B35, latar putih, teks #172B46, teks sekunder #64748B, garis #DFE8F1. Font Plus Jakarta Sans atau sans serif serupa. Kartu radius 16px, tombol radius 8px, shadow ringan, grid rapi, spacing kelipatan 8px.

Gunakan lebar desktop acuan 1440px dan ponsel 390px. Konten desktop maksimum 1368px, terpusat. Mobile memiliki margin 16px dan satu kolom. Pada lebar sampai 600px gunakan layout ponsel. Layout desktop berlaku di atas 600px, tetapi tetap boleh melipat grid agar tidak sempit pada tablet. Jangan mengecilkan seluruh halaman desktop menjadi gambar di ponsel.

Tampilkan badge DEMO DESAIN yang mudah terlihat. Gunakan identitas generik PORTAL DEMO, ikon orisinal, ilustrasi bisnis orisinal, dan kontak contoh hello@example.com. Kartu akses hanya berisi tombol Lihat demo dan teks Tanpa akun atau data pribadi. Tidak ada kolom kredensial, logo bank, identitas lembaga nyata, atau klaim perizinan.

Hasilkan satu halaman utuh yang dapat ditinjau secara visual, bukan enam halaman terpisah. Gambar hanya rujukan komposisi; bangun tipografi, tombol, grid, dan kartu sebagai elemen desain yang bisa diedit. Ikuti teks pada prompt jika ada ejaan atau rincian gambar yang berbeda. Konten boleh bertambah tinggi secara alami; jangan memaksa tinggi halaman sesuai rasio PNG.
```

## Tahap 1 — desktop: header dan hero

Lampiran: `images/01-desktop-header-hero.png`.

```text
Bangun bagian paling atas halaman mengikuti gambar 01.

Header putih tinggi sekitar 72px. Kiri: ikon geometris biru orisinal, PORTAL DEMO dan subjudul Portal Perusahaan. Kanan: badge DEMO DESAIN berbingkai oranye dan ikon menu biru. Gunakan satu header untuk seluruh halaman.

Di bawahnya, hero biru dengan ilustrasi gelombang abstrak dan siluet kota yang lembut, margin samping 36px pada desktop dan sudut membulat. Grid desktop dua kolom sekitar 55:45, padding 48px, elemen rata tengah secara vertikal.

Kolom kiri: pill PORTAL PERUSAHAAN; judul Satu portal. Seluruh kebutuhan bisnis Anda.; deskripsi Kelola layanan dan pantau pengajuan dalam satu tampilan.; label Pratinjau antarmuka perusahaan. Judul 48–56px, tebal, putih, line-height 1.15.

Kolom kanan: kartu putih dengan aksen garis oranye di atas, pill DEMONSTRASI, judul Jelajahi tampilan demo, ilustrasi jendela browser sederhana, deskripsi Lihat susunan layanan dan informasi perusahaan., tombol biru Lihat demo, dan catatan Tanpa akun atau data pribadi. Kartu ini bukan formulir login.

Pertahankan hero yang lapang dan teks mudah dibaca. Siapkan tempat untuk bagian layanan berikutnya tanpa menggandakan judulnya.
```

## Tahap 2 — desktop: layanan dan tracking

Lampiran: `images/02-desktop-layanan-tracking.png`.

```text
Lanjutkan tepat di bawah hero pada halaman yang sudah dibuat. Pertahankan header dan hero tahap 1.

Tambahkan section berbingkai tipis dan sudut 16px. Judul Layanan Perusahaan. Deskripsi Temukan layanan untuk mendukung kegiatan bisnis Anda.

Di bawah judul, grid dua kartu sama lebar, gap 32px. Kartu pertama memakai ilustrasi laptop dengan grafik biru, judul Manajemen Bisnis, deskripsi Pantau informasi dan kegiatan usaha dalam satu tampilan yang terstruktur., tombol Lihat layanan. Kartu kedua memakai ilustrasi folder, checklist dan tas kerja biru dengan detail oranye, judul Administrasi Usaha, deskripsi Temukan informasi persyaratan dan tahapan pengajuan layanan perusahaan., tombol utama Informasi layanan dan tombol outline Status pengajuan. Samakan tinggi area ilustrasi, ruang judul dan posisi tombol.

Di bawah section tersebut dengan gap 32px, tambahkan kartu Tracking Pengajuan. Ilustrasi tablet, globe dan pin lokasi di kiri; judul dan teks di kanan. Deskripsi Ketahui informasi dan perkembangan pengajuan layanan perusahaan Anda. Tombol Lihat tracking dengan panah kanan. Grid sekitar 35:65. Tidak ada formulir pengajuan atau form pelacakan baru.
```

## Tahap 3 — desktop: berita dan footer

Lampiran: `images/03-desktop-berita-footer.png`.

```text
Lanjutkan halaman yang sama setelah kartu tracking. Gunakan gambar 03 untuk section berita dan footer. Strip identitas di paling atas gambar 03 hanyalah konteks gambar mandiri: jangan tambahkan header kedua ke tengah halaman.

Tambahkan section Berita Terkini berbingkai tipis, deskripsi Informasi dan kegiatan terbaru untuk pengembangan bisnis Anda. Tampilkan tiga kartu berita desktop: label INFORMASI dengan judul Panduan pengelolaan usaha; label KEGIATAN dengan judul Agenda komunitas bisnis; label LAYANAN dengan judul Kenali alur pengajuan. Gunakan ilustrasi bisnis orisinal, area gambar dengan tinggi seragam, judul rapi dan tidak terpotong. Tambahkan tombol panah sebelumnya/berikutnya dan indikator halaman. Konten berita adalah contoh, bukan artikel yang sudah ada pada source.

Footer biru gelap dengan gelombang biru/sian, full width, padding sekitar 48px. Tiga kolom: PORTAL DEMO dan Konsep portal layanan perusahaan.; HUBUNGI KAMI dengan hello@example.com dan Kontak demonstrasi; BANTUAN dengan Pusat bantuan dan Kebijakan privasi. Tambahkan garis pembatas, teks DEMO DESAIN — identitas dan konten fiktif., serta © 2026 PORTAL DEMO.

Pastikan warna footer tetap satu keluarga dengan hero dan seluruh konten memiliki kontras yang nyaman dibaca.
```

## Tahap 4 — ponsel: header dan hero

Lampiran: `images/04-mobile-header-hero.png`.

```text
Adaptasikan bagian atas halaman yang sama ke lebar 390px mengikuti gambar 04. Ini versi responsif dari tahap 1, bukan halaman baru.

Header satu baris: identitas PORTAL DEMO di kiri, badge DEMO DESAIN dan menu di kanan. Sembunyikan subjudul Portal Perusahaan bila ruangnya tidak cukup. Jangan membuat teks atau ikon bertumpuk.

Hero menjadi satu kolom: pill, judul, deskripsi, lalu kartu demonstrasi. Padding samping 20px, judul sekitar 32px dan line-height 1.2. Kartu demonstrasi memiliki padding 24px, tetap memakai aksen oranye, ilustrasi, judul, deskripsi, tombol Lihat demo full width, dan catatan Tanpa akun atau data pribadi. Seluruh konten memiliki tinggi alami dan tidak keluar layar.

Mulai section Layanan Perusahaan di bawah hero dengan margin mobile 16px. Jangan menyalin heading dua kali jika sudah terdapat pada section tahap 2.
```

## Tahap 5 — ponsel: layanan dan tracking

Lampiran: `images/05-mobile-layanan-tracking.png`.

```text
Adaptasikan section tahap 2 ke satu kolom pada lebar 390px mengikuti gambar 05. Strip identitas di atas gambar 05 hanyalah konteks gambar mandiri: jangan menambahkan header kedua. Gunakan ikon identitas dari tahap 1 untuk seluruh ukuran layar, sekalipun bentuk ikon pada gambar ponsel sedikit berbeda. Urutan: judul Layanan Perusahaan dan deskripsi; kartu Manajemen Bisnis; kartu Administrasi Usaha; kartu Tracking Pengajuan.

Gunakan semua judul, deskripsi, dan label tombol yang sama dengan desktop. Ilustrasi berada di atas teks. Pada layanan kedua, tombol Informasi layanan dan Status pengajuan ditumpuk dengan gap 12px. Semua tombol utama full width, tinggi minimal 44px. Body sekitar 16px, line-height 1.6, judul kartu sekitar 24px. Padding kartu 20–24px dan jarak antarkartu 24–32px.

Tracking juga satu kolom: ilustrasi di atas, judul, deskripsi, lalu tombol Lihat tracking. Tidak ada scrolling horizontal dan tidak ada ruang kosong buatan untuk menyamakan tinggi kartu.
```

## Tahap 6 — ponsel: berita dan footer

Lampiran: `images/06-mobile-berita-footer.png`.

```text
Adaptasikan section tahap 3 untuk ponsel 390px mengikuti gambar 06.

Section Berita Terkini menampilkan satu kartu berita pada satu waktu, memakai kartu pertama dari daftar desktop sebagai tampilan awal: INFORMASI / Panduan pengelolaan usaha. Pertahankan dua kartu lainnya sebagai variasi carousel. Panah sebelumnya dan berikutnya mudah dijangkau, indikator halaman jelas, dan ilustrasi mengikuti lebar kartu. Berita tetap contoh visual.

Footer menjadi satu kolom dengan padding 24px. Urutan: PORTAL DEMO, deskripsi; HUBUNGI KAMI, kontak contoh; BANTUAN, dua tautan contoh; garis; pemberitahuan DEMO DESAIN — identitas dan konten fiktif.; copyright. Gunakan seluruh lebar yang tersedia agar teks tidak menumpuk pada kolom sempit. Pertahankan gelombang biru, kontras tinggi dan jarak antarkelompok 28–32px.
```

## Prompt penyatuan dan pemeriksaan akhir

```text
Tinjau hasil keenam tahap sebagai SATU halaman dengan versi desktop dan ponsel.

Pastikan hanya ada satu header, satu hero, satu judul Layanan Perusahaan, dua kartu layanan, satu tracking, satu berita, dan satu footer. Tidak ada strip identitas berulang di tengah halaman. Semua elemen menggunakan font, warna, radius, ikon dan ilustrasi yang konsisten. Teks utama PORTAL DEMO dan DEMO DESAIN terlihat jelas.

Periksa lebar 320, 390, 600, 601, 768, 1024 dan 1440px. Tidak ada overflow horizontal, teks terpotong, kartu bertabrakan, atau tombol keluar bingkai. Header tetap rapi, grid melipat saat ruang berkurang, semua target kontrol minimal 44px, dan teks isi ponsel nyaman dibaca. Jangan menggunakan seluruh PNG sebagai pengganti elemen desain.

Pertahankan satu halaman demonstrasi dengan identitas fiktif, kontak contoh, dan kartu akses tanpa kredensial. Jangan menambahkan dashboard, OTP, login, transaksi atau halaman registrasi yang tidak terdapat dalam ruang lingkup desain ini.

Siapkan dua artboard utama: Desktop 1440px dan Mobile 390px. Tinggi mengikuti konten, tanpa pemotongan bagian akhir footer.
```
