import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Mail, Phone } from "lucide-react";
import { Brand } from "./Brand";
import { useAuth } from "../auth";
import { bank } from "../../shared/brand";
const links = [
  ["Beranda", "/"],
  ["Registrasi Online", "/registration/corporate"],
  ["Cash Management", "/#cash-management"],
  ["Giro", "/#giro"],
  ["Status Registrasi Giro", "/registration/giro/status"],
  ["Tracking", "/tracking"],
  ["Berita Terkini", "/#news"],
  ["Pusat Bantuan", "/help"],
  ["RedTiger", "/redtiger"],
  ["Kebijakan Privasi", "/privacy"],
  ["Masuk", "/#login"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement;
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (event.key === "Tab") {
        const items = Array.from(
          panel.current?.querySelectorAll<HTMLElement>("a, button") || [],
        );
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      if (panel.current?.contains(document.activeElement)) previous?.focus();
    };
  }, [open]);
  return (
    <header className="site-header">
      <Link to="/" aria-label="Nusa Corporate beranda">
        <Brand />
      </Link>
      <button
        ref={toggle}
        className="menu-toggle"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <>
          <div
            className="menu-backdrop"
            onClick={() => {
              setOpen(false);
              toggle.current?.focus();
            }}
          />
          <div
            ref={panel}
            id="navigation"
            className="navigation-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi"
          >
            <nav aria-label="Navigasi utama">
              {links.map(([label, to]) => (
                <Link
                  key={label}
                  to={label === "Masuk" && user ? "/dashboard" : to}
                  aria-current={
                    location.pathname + location.hash === to
                      ? "page"
                      : undefined
                  }
                  onClick={() => {
                    setOpen(false);
                    toggle.current?.focus();
                  }}
                >
                  {label === "Masuk" && user ? "Dashboard" : label}
                </Link>
              ))}
            </nav>
            <button
              className="outline-button"
              onClick={() => {
                setOpen(false);
                toggle.current?.focus();
              }}
            >
              Tutup menu
            </button>
          </div>
        </>
      )}
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-columns">
        <div>
          <h3>KANTOR PUSAT</h3>
          <strong>PT Bank Rakyat Indonesia (Persero) Tbk.</strong>
          <p>
            JL. Jenderal Sudirman Kav. 44-46, Jakarta, 10210, Indonesia
            <br />
          </p>
        </div>
        <div>
          <h3>HUBUNGI KAMI</h3>
          <Link to="/help#contact">
            <Phone size={16} /> 1500001
          </Link>
          <Link to="/help#contact">
            <Mail size={16} /> {`QLola@${bank}.co.id`}
          </Link>
        </div>
        <div>
          <h3>BANTUAN</h3>
          <Link to="/help">Pusat Bantuan</Link>
          <Link to="/privacy">Kebijakan Privasi</Link>
        </div>
      </div>
      <p className="footer-notice">
        PT Bank Rakyat Indonesia (Persero) Tbk berizin dan diawasi oleh Otoritas
        Jasa Keuangan (OJK) dan Bank Indonesia (BI), serta merupakan peserta
        penjaminan simpanan yang terdaftar pada Lembaga Penjamin Simpanan (LPS).
        LPS menjamin simpanan hingga Rp2.000.000.000,- (dua miliar rupiah) per
        nasabah, per bank. Informasi lebih lanjut mengenai tingkat bunga
        penjaminan simpanan dan ketentuan lainnya dapat diakses melalui situs
        resmi LPS di https://apps.lps.go.id/.
      </p>
      <p className="copyright">© QLola BRI. | All Rights Reserved.</p>
    </footer>
  );
}
export function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash)
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        }),
      );
    else {
      window.scrollTo(0, 0);
      document
        .querySelector<HTMLElement>("main h1")
        ?.focus({ preventScroll: true });
    }
  }, [location]);
  return null;
}
export function Page({
  title,
  children,
  intro,
}: {
  title: string;
  children: ReactNode;
  intro?: string;
}) {
  return (
    <main id="main" className="secondary-page">
      <Link className="back-link" to="/">
        ← Kembali ke beranda
      </Link>
      <h1 tabIndex={-1}>{title}</h1>
      {intro && <p className="page-intro">{intro}</p>}
      {children}
    </main>
  );
}
