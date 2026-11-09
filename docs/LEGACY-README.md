# Tinjauan visual lokal — DEMO

Situs referensi: `https://qlolabbri.com/token`.

Halaman menampilkan gambar yang otomatis mengikuti lebar layar: versi ponsel sampai 600 px dan versi desktop di atas 600 px. Pemilihan menggunakan elemen HTML `picture` dan tetap bekerja tanpa JavaScript. Tidak ada toolbar, tombol pemilih, atau panel penjelasan; hanya label DEMO kecil di atas gambar.

Tampilan bersifat noninteraktif, **bukan replika login bank 1:1**. HTML sumber berisi skrip yang mengirim Corporate ID, User ID, dan kata sandi ke `test.php`. Skrip dan formulir tersebut tidak disalin ke pratinjau.

## Jalankan

```powershell
cd C:\Users\SAMUEL\Downloads\qlolabbri-visual-review
npm.cmd start
```

Buka `http://127.0.0.1:4173` atau `http://127.0.0.1:4173/token`.

Pratinjau hanya menyajikan file lokal. Tidak ada input kredensial, backend login, request CDN, atau pengiriman formulir. Tidak dipublikasikan.

## Hasil observasi

- Playwright menggunakan Google Chrome headless yang sudah terpasang.
- Viewport desktop 1440 × 1000 dan ponsel 390 × 844, device scale factor 1.
- Halaman utama berhasil diakses langsung dengan izin jaringan. Pada pemeriksaan ulang, permintaan gambar dan API publik diteruskan melalui relay proxy: `images.weserv.nl` untuk gambar dan `r.jina.ai` untuk JSON API. Ini bukan proxy CONNECT untuk seluruh koneksi browser.
- Relay halaman AllOrigins dan CodeTabs mengembalikan HTTP 522; Corsproxy mengembalikan HTTP 401. Halaman utama tetap diakses langsung karena responsnya HTTP 200.
- Proxy berhasil memuat logo, latar utama, latar footer, ikon, gambar layanan, teks UI, serta daftar banner. Bagian utama kini terlihat. Empat gambar banner dari API masih gagal. Pemeriksaan relay alternatif terhadap gambar banner pertama mengonfirmasi HTTP 500 dari server sumber dengan pesan `Internal server error, Please come back later`.
- Tangkapan diambil setelah `load`, pemeriksaan jaringan, font, gambar, scrolling, dan tiga sampel layout stabil. Sampel layout stabil tidak berarti seluruh aset berhasil dimuat. Kelengkapan 100% belum terverifikasi karena kesalahan server banner.
- `public/references/reference-desktop.png` dan `reference-mobile.png`: kondisi awal melalui koneksi langsung.
- `public/references/reference-proxy-desktop.png` dan `reference-proxy-mobile.png`: hasil terbaru memakai relay proxy gambar/API.
- `artifacts/capture-report.json`: laporan awal. `artifacts/proxy-capture-report.json`: laporan proxy, termasuk provider dan status masing-masing permintaan.
- `artifacts/proxy-banner-image-response.txt`: respons relay alternatif yang mencatat kesalahan HTTP 500 dari server banner sumber.
- `public/report.json`: laporan teknis yang tetap tersimpan sebagai berkas; tidak dimuat atau ditampilkan dalam halaman. Metadata `transport` menjelaskan jalur koneksi yang digunakan.

Untuk mengambil ulang tangkapan (membutuhkan akses jaringan dan Chrome):

```powershell
npm.cmd run capture
node scripts/capture.mjs --relay
npm.cmd run verify
```

Tangkapan ulang dalam mode `--relay` memperbarui gambar yang ditampilkan dalam pratinjau. Server lokal menolak metode selain GET/HEAD; Content Security Policy memblokir pengiriman form dan koneksi eksternal.

Mode `--relay` dapat memakai ulang respons JSON publik yang sudah diambil dalam sesi pemeriksaan ini dari `artifacts/proxy-api-response.txt` dan `artifacts/proxy-banner-response.txt`. Jika file tersebut tidak ada, respons diminta kembali melalui relay. Respons cache tersebut bukan jaminan data live terbaru. Tidak ada cookie atau kredensial pengguna yang diteruskan ke relay.
