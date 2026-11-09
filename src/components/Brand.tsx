import { bankUpper } from "../../shared/brand";

export function Brand({ hero = false }: { hero?: boolean }) {
  return hero ? (
    <div
      className="hero-brand"
      aria-label="Nusa Corporate, aplikasi independen"
    >
      <img
        className="hero-logo"
        src="/assets/qlola-logo.png"
        alt={`QLola by ${bankUpper}`}
        width="1312"
        height="474"
      />
      <p>Integrated Corporate Solution</p>
    </div>
  ) : (
    <span className="brand">
      <img src="/assets/nusa-mark.svg" alt="" width="36" height="36" />
    </span>
  );
}
