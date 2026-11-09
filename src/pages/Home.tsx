import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Brand } from "../components/Brand";
import { LoginForm } from "../components/LoginForm";
import { api } from "../api";
import { bankUpper } from "../../shared/brand";
const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 40;
// Carousel banners, shown in this order regardless of the image stored for
// each article (a stale server or database may still return the old one).
const NEWS_BANNERS = [
  "/assets/berita/berita-1.jpg",
  "/assets/berita/berita-2.jpg",
  "/assets/berita/berita-3.jpg",
  "/assets/berita/berita-4.jpg",
];
export function NewsCarousel() {
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const query = useQuery({ queryKey: ["news"], queryFn: api.news });
  const items = query.data || [];
  const count = items.length;
  // Keep the index valid if a refetch returns fewer articles.
  const active = count ? Math.min(index, count - 1) : 0;
  const move = useCallback(
    (step: number) => {
      if (count)
        setIndex((v) => (Math.min(v, count - 1) + step + count) % count);
    },
    [count],
  );
  // Like the reference: the previous slide peeks (dimmed) on the left, the
  // active slide follows it, and the track never scrolls past its last slide.
  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || !count) return setOffset(0);
    const slides = track.children as HTMLCollectionOf<HTMLElement>;
    const anchor = slides[Math.max(active - 1, 0)];
    const max = Math.max(track.scrollWidth - viewport.clientWidth, 0);
    setOffset(Math.min(anchor ? anchor.offsetLeft : 0, max));
  }, [active, count]);
  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measure]);
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => move(1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, count, paused, move]);
  return (
    <section
      id="news"
      className="section-box news-section"
      aria-roledescription="karusel"
      aria-label="Berita Terkini"
    >
      <h2>Berita Terkini</h2>
      <p>Dapatkan informasi dan event-event terkini seputar Nusa</p>
      <div
        className="carousel-content"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setPaused(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          else if (event.key === "ArrowRight") move(1);
        }}
      >
        <button
          className="carousel-arrow previous"
          aria-label="Berita sebelumnya"
          onClick={() => move(-1)}
          disabled={count < 2}
        >
          <ChevronLeft size={20} />
        </button>
        {query.isPending ? (
          <p role="status">Memuat berita…</p>
        ) : query.isError ? (
          <div role="alert">
            <p>Berita belum dapat dimuat.</p>
            <button
              className="text-button"
              onClick={() => void query.refetch()}
            >
              Coba lagi
            </button>
          </div>
        ) : count ? (
          <div
            className="news-viewport"
            ref={viewportRef}
            onPointerDown={(event) => {
              swipe.current = {
                x: event.clientX,
                y: event.clientY,
                moved: false,
              };
            }}
            onPointerUp={(event) => {
              const start = swipe.current;
              if (!start) return;
              const dx = event.clientX - start.x;
              if (
                Math.abs(dx) > SWIPE_THRESHOLD &&
                Math.abs(dx) > Math.abs(event.clientY - start.y)
              ) {
                start.moved = true;
                move(dx < 0 ? 1 : -1);
              }
            }}
            onPointerCancel={() => (swipe.current = null)}
            onClickCapture={(event) => {
              // A swipe must not also open the article under the pointer.
              if (swipe.current?.moved) event.preventDefault();
              swipe.current = null;
            }}
          >
            <div
              className="news-slides"
              ref={trackRef}
              aria-live={paused ? "polite" : "off"}
              style={{ transform: `translate3d(${-offset}px,0,0)` }}
            >
              {items.map((article, i) => (
                <Link
                  key={article.id}
                  to={`/news/${article.slug}`}
                  className={`news-slide${i === active ? " is-active" : ""}${i < active ? " is-past" : ""}`}
                  aria-label={`Baca ${article.title}`}
                  aria-roledescription="slide"
                  aria-current={i === active ? "true" : undefined}
                  draggable={false}
                >
                  <img
                    src={NEWS_BANNERS[i] ?? article.image}
                    alt=""
                    width="1672"
                    height="941"
                    loading={i < 4 ? "eager" : "lazy"}
                    draggable={false}
                    onError={(event) => {
                      if (!event.currentTarget.src.endsWith("/assets/news.svg"))
                        event.currentTarget.src = "/assets/news.svg";
                    }}
                  />
                  <span className="sr-only">{article.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p>Belum ada berita.</p>
        )}
        <button
          className="carousel-arrow next"
          aria-label="Berita berikutnya"
          onClick={() => move(1)}
          disabled={count < 2}
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="carousel-pagination" aria-label="Pilih berita">
        {items.map((article, i) => (
          <button
            key={article.id}
            className={active === i ? "active" : ""}
            aria-label={`Berita ${i + 1}: ${article.title}`}
            aria-current={active === i ? "true" : undefined}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
export function Home() {
  return (
    <main id="main">
      <section className="hero" aria-label="Nusa Corporate">
        <h1 className="sr-only" tabIndex={-1}>
          Nusa Corporate — Integrated Corporate Solution
        </h1>
        <Brand hero />
        <LoginForm />
      </section>
      <div className="home-sections">
        <section id="registration" className="section-box registration-section">
          <h2>Registrasi Online</h2>
          <p>
            Dapatkan akses ke Nusa Corporate dengan mendaftarkan perusahaan Anda
            pada fitur-fitur berikut
          </p>
          <div className="registration-grid">
            <article id="cash-management" className="service">
              <img
                className="service-image"
                src="/assets/cash.png"
                alt="Ilustrasi pengelolaan perusahaan melalui laptop"
                width="408"
                height="200"
              />
              <h3>Cash Management</h3>
              <p>
                Layanan Cash Management System atau Internet Banking yang
                memungkinkan Perusahaan memperoleh informasi mengenai rekening,
                manajemen likuiditas, serta transaksi swalayan secara online
                real-time tanpa batasan tempat dan waktu. Ditujukan bagi
                Perusahaan yang memerlukan solusi perbankan yang mudah
                digunakan, modern, aman, dan dinamis.
              </p>
              <div className="service-actions">
                <Link className="button" to="/registration/corporate">
                  Buat Akun
                </Link>
              </div>
            </article>
            <article id="giro" className="service">
              <img
                className="service-image"
                src="/assets/giro.svg"
                alt={`Ilustrasi tiga kartu Giro ${bankUpper}`}
                width="408"
                height="200"
              />
              <h3>Giro {bankUpper}</h3>
              <p>
                Sebagai salah satu sarana penunjang kelangsungan bisnis usaha
                Anda. Kami hadir dengan menawarkan kemudahan pengajuan bisnis
                melalui Giro {bankUpper}. Giro {bankUpper} adalah pilihan
                layanan dalam berbagai mata uang yang dapat menjadi solusi
                bisnis bagi Anda.
              </p>
              <div className="service-actions">
                <Link className="button" to="/registration/giro">
                  Registrasi
                </Link>
                <Link className="outline-button" to="/registration/giro/status">
                  Status Registrasi Giro
                </Link>
              </div>
            </article>
          </div>
        </section>
        <section className="section-box tracking-section" id="tracking">
          <img
            src="/assets/tracking.png"
            alt="Ilustrasi pelacakan pengajuan pada peta dunia"
            width="300"
            height="200"
          />
          <div>
            <h2>Tracking</h2>
            <p>
              Nikmati kemudahan layanan tracking untuk mengetahui informasi
              terkini mengenai status pengajuan produk atau layanan perusahaan
              Anda.
            </p>
            <Link className="button" to="/tracking">
              Tracking <ArrowRight size={22} />
            </Link>
          </div>
        </section>
        <NewsCarousel />
      </div>
    </main>
  );
}
