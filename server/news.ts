import type { News } from "../shared/models";
export const initialNews: News[] = [
  {
    id: "news-1",
    title: "Menata administrasi perusahaan dalam satu portal",
    slug: "administrasi-perusahaan",
    summary:
      "Langkah sederhana untuk menjaga data pengajuan perusahaan tetap teratur.",
    image: "/assets/berita/berita-1.jpg",
    category: "Panduan",
    publicationDate: "2026-10-15T03:00:00.000Z",
    content: [
      "Administrasi yang rapi membantu tim mengetahui pengajuan yang sudah dikirim dan tindak lanjut yang masih diperlukan. Mulailah dengan menyiapkan informasi perusahaan dan menentukan satu penanggung jawab untuk setiap pengajuan.",
      "Di Nusa Corporate, pengajuan yang berhasil disimpan mendapat nomor referensi unik. Simpan nomor tersebut bersama dokumen internal perusahaan agar tim dapat menemukan catatan yang benar saat diperlukan.",
      "Periksa dashboard secara berkala. Informasi yang konsisten dan catatan waktu pengajuan membantu mengurangi pengiriman ulang serta memudahkan koordinasi antaranggota tim.",
    ],
  },
  {
    id: "news-2",
    title: "Mengenal tahapan pengajuan layanan",
    slug: "tahapan-pengajuan",
    summary: "Pahami arti status Diajukan, Dalam Peninjauan, hingga Selesai.",
    image: "/assets/berita/berita-2.jpg",
    category: "Informasi",
    publicationDate: "2026-10-20T03:00:00.000Z",
    content: [
      "Setelah formulir disimpan, pengajuan mendapat status Diajukan. Status ini berarti catatan sudah diterima aplikasi, belum berarti layanan telah disetujui.",
      "Dalam Peninjauan menunjukkan bahwa operator sedang memeriksa pengajuan. Jika informasi perlu dilengkapi, status dapat berubah menjadi Membutuhkan Perbaikan. Ikuti arahan administrator instalasi untuk memberikan pembaruan.",
      "Status Disetujui dan Selesai hanya diberikan melalui proses operasional pengelola. Aplikasi tidak menaikkan status secara otomatis hanya karena halaman diperbarui. Riwayat yang tampil mencatat perubahan yang benar-benar disimpan.",
    ],
  },
  {
    id: "news-3",
    title: "Menjaga keamanan akun kerja",
    slug: "keamanan-akun-kerja",
    summary:
      "Kebiasaan penggunaan akun yang membantu menjaga kerahasiaan data perusahaan.",
    image: "/assets/berita/berita-3.jpg",
    category: "Keamanan",
    publicationDate: "2026-10-25T03:00:00.000Z",
    content: [
      "Gunakan kata sandi khusus untuk akun aplikasi dan jangan membagikannya kepada rekan kerja. Akun Nusa Corporate terpisah dari akun layanan perbankan Anda.",
      "Setelah selesai menggunakan perangkat bersama, pilih Keluar dari dashboard. Jika sesi berakhir, aplikasi akan meminta Anda masuk kembali sebelum membuka data pengajuan.",
      "Perhatikan alamat aplikasi yang diberikan administrator. Jika membutuhkan bantuan pemulihan, gunakan tautan pada halaman masuk dan hubungi pengelola instalasi.",
    ],
  },
  {
    id: "news-4",
    title: "Menyiapkan data sebelum registrasi",
    slug: "persiapan-registrasi",
    summary:
      "Daftar informasi perusahaan yang perlu disiapkan sebelum membuat pengajuan.",
    image: "/assets/berita/berita-4.jpg",
    category: "Panduan",
    publicationDate: "2026-11-01T03:00:00.000Z",
    content: [
      "Siapkan nama perusahaan sesuai catatan usaha, jenis badan usaha, alamat, kota, dan provinsi. Gunakan alamat email perusahaan yang aktif serta nomor kontak yang dapat dihubungi.",
      "Untuk pengajuan Giro, tentukan produk yang sesuai dengan kebutuhan administrasi Anda. Pilihan produk di aplikasi merupakan informasi permohonan, bukan pembukaan rekening secara langsung.",
      "Periksa ulang informasi sebelum menekan Kirim Pengajuan. Setelah muncul konfirmasi, simpan nomor referensi dan gunakan halaman Tracking untuk melihat status catatan Anda.",
    ],
  },
];
