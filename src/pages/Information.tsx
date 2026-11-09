import { Link } from "react-router-dom";
import { appName, bankUpper } from "../../shared/brand";
import { Page } from "../components/Layout";
export function Help() {
  return (
    <Page title="Pusat Bantuan" intro={`Informasi penggunaan ${appName}.`}>
      <div className="prose">
        <section>
          <h2>RedTiger</h2>
          <p>
            RedTiger dijalankan secara terpisah dari aplikasi Qlolabbri. Lihat
            petunjuk di halaman{" "}
            <Link className="text-button" to="/redtiger">
              RedTiger
            </Link>
            .
          </p>
        </section>
        <details open>
          <summary>Bagaimana membuat pengajuan?</summary>
          <p>
            Masuk dengan akun {appName}, pilih Cash Management atau Giro pada
            beranda, lengkapi data perusahaan, lalu simpan nomor referensi yang
            diterima.
          </p>
        </details>
        <details>
          <summary>Bagaimana melihat status pengajuan?</summary>
          <p>
            Buka Tracking atau Status Registrasi Giro. Masukkan nomor referensi.
            Anda hanya dapat melihat pengajuan milik akun yang sedang masuk.
          </p>
        </details>
        <details>
          <summary>Saya tidak bisa masuk atau sesi berakhir</summary>
          <p>
            Pastikan Anda menggunakan akun {appName}. Jika sesi berakhir, masuk
            kembali. Gunakan halaman{" "}
            <Link className="text-button" to="/forgot-password">
              pemulihan kata sandi
            </Link>{" "}
            untuk mengajukan bantuan.
          </p>
        </details>
        <section id="account-access">
          <h2>Akses Akun</h2>
          <p>
            Untuk menjaga keamanan, informasi akses tidak ditampilkan di halaman
            ini. Gunakan kredensial yang diberikan administrator aplikasi. Jika
            Anda belum menerima akses atau mengalami kendala, hubungi
            administrator melalui informasi kontak yang tersedia.
          </p>
          <Link className="button" to="/login">
            Masuk ke Aplikasi
          </Link>
        </section>
        <section id="contact">
          <h2>Hubungi Kami</h2>
          <p>
            Dukungan disediakan oleh pengelola instalasi {appName}. Hubungi
            administrator yang memberikan akun Anda. Alamat email dan nomor
            layanan organisasi belum dikonfigurasi pada instalasi lokal ini.
          </p>
          <p>
            Untuk bantuan pemulihan,{" "}
            <Link className="text-button" to="/forgot-password">
              kirim permintaan bantuan
            </Link>
            . Instalasi lokal menyimpan permintaan; pengiriman email memerlukan
            konfigurasi operator.
          </p>
        </section>
      </div>
    </Page>
  );
}
export function RedTiger() {
  const instructions = String.raw`cd "C:\Users\SAMUEL\OneDrive\ドキュメント\RedTiger-Tools-main\RedTiger-Tools-main"
.\.venv\Scripts\python.exe .\redtiger.py`;
  return (
    <Page
      title="RedTiger"
      intro="Jalankan RedTiger secara terpisah dari aplikasi Qlolabbri menggunakan terminal:"
    >
      <div className="prose">
        <pre>
          <code>{instructions}</code>
        </pre>
      </div>
    </Page>
  );
}
export function Privacy() {
  return (
    <Page
      title="Kebijakan Privasi"
      intro={`Berlaku untuk aplikasi independen ${appName}.`}
    >
      <div className="prose">
        <h2>Data yang Disimpan</h2>
        <p>
          Aplikasi menyimpan data akun, informasi perusahaan yang Anda kirim,
          riwayat status pengajuan, dan sesi masuk. Kata sandi akun disimpan
          sebagai hash pada server; kata sandi tidak disimpan di penyimpanan
          browser.
        </p>
        <h2>Tujuan Penggunaan</h2>
        <p>
          Data dipakai untuk mengelola pengajuan, menampilkan status kepada
          pemiliknya, dan memberikan bantuan akun. Registrasi di sini tidak
          membuka rekening bank dan tidak menjalankan transaksi keuangan.
        </p>
        <h2>Akses dan Sesi</h2>
        <p>
          Hanya pengguna yang berwenang yang dapat melihat catatan pengajuannya.
          Sesi memiliki batas waktu dan berakhir saat Anda keluar. Cookie sesi
          diperlukan untuk menjalankan aplikasi.
        </p>
        <h2>Penyimpanan dan Penghapusan</h2>
        <p>
          Mode lokal menyimpan catatan pada perangkat server. Instalasi dengan
          PostgreSQL menyimpan data di database yang ditentukan pengelola. Untuk
          koreksi, ekspor, penghapusan data, dan informasi masa penyimpanan,
          hubungi administrator instalasi melalui{" "}
          <Link className="text-button" to="/help#contact">
            Pusat Bantuan
          </Link>
          .
        </p>
        <h2>Identitas Aplikasi</h2>
        <p>
          {appName} berafiliasi dengan {bankUpper}. Memasukkan kredensial
          layanan perbankan ke aplikasi ini.
        </p>
      </div>
    </Page>
  );
}
