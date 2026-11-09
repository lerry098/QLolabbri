# Paket desain untuk Stitch

Paket ini hanya untuk folder `qlolabbri-visual-review`.

Kode yang ditinjau merupakan pratinjau satu halaman: `public/index.html` memilih gambar desktop atau ponsel melalui elemen `picture`. Tidak ada halaman dashboard, formulir aktif, atau alur transaksi di aplikasi lokal ini. Karena itu, tahap di bawah merupakan bagian halaman dan adaptasi responsifnya.

Desain baru menggunakan identitas generik **PORTAL DEMO**, bukan identitas bank pada tangkapan referensi. Area akses menggunakan kartu demonstrasi tanpa kolom kredensial. Struktur besarnya tetap: header → hero → layanan → tracking → berita → footer. Gambar berita merupakan ilustrasi konsep baru karena banner pada referensi belum berhasil dimuat.

## Isi dan urutan penggunaan

| Tahap | Gambar | Yang dibangun di Stitch |
| --- | --- | --- |
| 1 | `images/01-desktop-header-hero.png` | Header dan hero desktop, kartu akses demo |
| 2 | `images/02-desktop-layanan-tracking.png` | Dua layanan dan kartu tracking desktop |
| 3 | `images/03-desktop-berita-footer.png` | Berita dan footer desktop |
| 4 | `images/04-mobile-header-hero.png` | Header dan hero pada ponsel |
| 5 | `images/05-mobile-layanan-tracking.png` | Layanan dan tracking satu kolom |
| 6 | `images/06-mobile-berita-footer.png` | Berita dan footer satu kolom |

Mulai dengan aturan global pada [PROMPT-STITCH.md](PROMPT-STITCH.md), lalu gunakan prompt tahap 1–6 secara berurutan bersama gambar bernomor sama. Tahap 4–6 mengadaptasi halaman yang sama, bukan membuat halaman baru. Prompt final di dokumen tersebut menyatukan dan memeriksa hasilnya.

## Dokumen pendamping

- [PROMPT-STITCH.md](PROMPT-STITCH.md): instruksi siap salin per tahap dan pemeriksaan akhir.
- [SPESIFIKASI.md](SPESIFIKASI.md): ukuran, warna, tipografi, komponen, teks, serta hubungan dengan kode awal.
- `prompts/`: prompt pembuatan gambar yang digunakan, satu berkas per gambar.
- `manifest.json`: daftar gambar, dimensi sebenarnya, serta metode pembuatan setelah seluruh aset selesai.

Gambar adalah mockup konseptual, bukan tangkapan aplikasi berjalan. Gambar dibuat dengan tool bawaan `imagegen`; teks dan ukuran yang mengikat untuk implementasi berada di dokumen spesifikasi dan prompt Stitch. Source aplikasi lokal tidak diubah oleh paket ini.
