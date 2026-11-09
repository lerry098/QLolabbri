import { expect, test, type Page } from "@playwright/test";
import type { Application } from "../../shared/models";
async function enterCredentials(page: Page, password = "jarwo123!") {
  await page.getByLabel("Corporate ID", { exact: true }).fill("JarwoCorp");
  await page.getByLabel("User ID", { exact: true }).fill("jarwo");
  await page.getByLabel("Kata Sandi", { exact: true }).fill(password);
}
async function login(page: Page, path = "/login") {
  await page.goto(path);
  await enterCredentials(page);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
async function companyForm(page: Page, giro = false) {
  await page.getByLabel("Nama Perusahaan").fill(`PT Uji Nusa ${Date.now()}`);
  await page.getByLabel("Jenis Usaha").selectOption("PT");
  await page.getByLabel("Email Perusahaan").fill("company@example.test");
  await page
    .getByLabel(giro ? "Nama Kontak" : "Penanggung Jawab")
    .fill("Dewi Putri");
  await page.getByLabel("Nomor Telepon").fill("0812 3456 7890");
  await page.getByLabel("Kota", { exact: false }).fill("Bandung");
  if (giro) await page.getByLabel("Jenis Produk").selectOption("Giro Rupiah");
  else {
    await page.getByLabel("Alamat Usaha").fill("Jalan Usaha Nomor 10");
    await page.getByLabel("Provinsi").fill("Jawa Barat");
  }
  await page.getByRole("checkbox").check();
}
function giroStatusRecord(referenceNumber: string): Application {
  return {
    id: "e1269292-f695-48a6-8c8b-d9276dd85a00",
    ownerId: "jarwo",
    kind: "giro",
    referenceNumber,
    companyName: "PT Pengujian Status Giro",
    businessType: "PT",
    contactEmail: "company@example.test",
    contactName: "Dewi Putri",
    phone: "081234567890",
    city: "Bandung",
    productType: "Giro Rupiah",
    status: "Diajukan",
    createdAt: "2026-11-09T10:00:00.000Z",
    updatedAt: "2026-11-09T10:00:00.000Z",
    events: [
      {
        id: "3c3cbbea-5d48-4ca6-a189-d79894f962e3",
        status: "Diajukan",
        description: "Pengajuan diterima.",
        createdAt: "2026-11-09T10:00:00.000Z",
      },
    ],
  };
}
test("home consists of real semantic sections and locally loaded assets", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4185") &&
      !r.url().startsWith("ws://127.0.0.1:4185")
    )
      external.push(r.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Registrasi Online" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cash Management", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("form", { name: "Masuk Nusa Corporate" }),
  ).toBeVisible();
  await expect(page.locator("input")).toHaveCount(3);
  await expect(page.locator("#capture")).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (img) =>
              (img as HTMLImageElement).complete &&
              (img as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("navigation supports keyboard, outside click, active links and same-page scrolling", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Buka menu" });
  await toggle.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Beranda", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Tutup menu", exact: true }).last(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator(".menu-backdrop").click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await toggle.click();
  await page
    .getByRole("link", { name: "Cash Management", exact: true })
    .click();
  await expect(page).toHaveURL(/#cash-management$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await toggle.click();
  await expect(
    page.getByRole("link", { name: "Cash Management", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});
test("RedTiger page provides separate terminal instructions without app actions", async ({
  page,
}) => {
  await page.goto("/redtiger");
  await expect(page.getByRole("heading", { name: "RedTiger" })).toBeVisible();
  await expect(page.locator("main pre code")).toHaveText(
    String.raw`cd "C:\Users\SAMUEL\OneDrive\ドキュメント\RedTiger-Tools-main\RedTiger-Tools-main"
.\.venv\Scripts\python.exe .\redtiger.py`,
  );
  await expect(
    page.locator(
      "main .prose a, main .prose button, main .prose form, main .prose input",
    ),
  ).toHaveCount(0);
});
test("login inputs, masking, empty protection and invalid feedback work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Masuk", exact: true }),
  ).toBeDisabled();
  await enterCredentials(page, "WrongPassword!");
  await expect(page.getByLabel("Kata Sandi", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("button", { name: "Tampilkan kata sandi" }).click();
  await expect(page.getByLabel("Kata Sandi", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Sembunyikan kata sandi" }).click();
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("tidak sesuai");
});
test("private dashboard requires login and logout invalidates the session", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/login");
  await enterCredentials(page);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Profil Akun" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get("/api/dashboard/overview")).status()).toBe(
    401,
  );
});

test("registration menu opens its form after login has opened Dashboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Buka menu" }).click();
  await page
    .getByRole("link", { name: "Registrasi Online", exact: true })
    .click();
  await expect(page).toHaveURL("/login");
  await enterCredentials(page);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("form", { name: "Form registrasi corporate" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Buka menu" }).click();
  await page
    .getByRole("link", { name: "Registrasi Online", exact: true })
    .click();
  await expect(page).toHaveURL("/registration/corporate");
  await expect(
    page.getByRole("heading", {
      name: "Registrasi Cash Management",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("form", { name: "Form registrasi corporate" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Buka menu" }).click();
  await expect(
    page.getByRole("link", { name: "Registrasi Online", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("login opens Dashboard even from a legacy registration returnTo link", async ({
  page,
}) => {
  await login(page, "/login?returnTo=%2Fregistration%2Fcorporate");
  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("form", { name: "Form registrasi corporate" }),
  ).toHaveCount(0);
});

test("forgot-password navigation, validation and generic confirmation work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "LUPA KATA SANDI?" }).click();
  await expect(page).toHaveURL("/forgot-password");
  await page.getByRole("button", { name: "Kirim Permintaan" }).click();
  await expect(page.locator("#email-error")).toBeVisible();
  await page.getByLabel("Email Akun").fill("abangmedan0807@gmail.com");
  await page.getByRole("button", { name: "Kirim Permintaan" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Permintaan bantuan telah diterima",
  );
  await page.getByRole("link", { name: "Kembali ke Login" }).click();
  await expect(page).toHaveURL("/login");
});
test("cash management creates a persistent reference that tracking can find", async ({
  page,
}) => {
  await login(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Buat Akun", exact: true }).click();
  await expect(page).toHaveURL("/registration/corporate");
  await page.getByRole("button", { name: "Kirim Pengajuan" }).click();
  await expect(page.locator("#companyName-error")).toBeVisible();
  await companyForm(page);
  await page.getByRole("button", { name: "Kirim Pengajuan" }).click();
  await expect(
    page.getByRole("heading", { name: "Pengajuan berhasil disimpan" }),
  ).toBeVisible();
  const reference = await page.locator("output").innerText();
  expect(reference).toMatch(/^IND-COR-[A-F0-9]{12}$/);
  await page.getByRole("link", { name: "Lihat Status Pengajuan" }).click();
  await expect(
    page.getByRole("region", { name: "Hasil pelacakan" }),
  ).toContainText(reference);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Hasil pelacakan" }),
  ).toContainText("Diajukan");
  await expect(
    page.getByRole("list", { name: "Riwayat pengajuan" }),
  ).toBeVisible();
});
test("giro registration, giro status and landing tracking route work", async ({
  page,
}) => {
  await login(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Registrasi", exact: true }).click();
  await expect(page).toHaveURL("/registration/giro");
  await companyForm(page, true);
  await page.getByRole("button", { name: "Kirim Pengajuan" }).click();
  await expect(page.locator("output")).toBeVisible();
  const reference = await page.locator("output").innerText();
  expect(reference).toMatch(/^IND-GIR-/);
  await page.getByRole("link", { name: "Ke Dashboard", exact: true }).click();
  await expect(
    page.locator(".application-link").filter({ hasText: reference }),
  ).toHaveAttribute("href", `/registration/giro/status?reference=${reference}`);
  await page
    .getByRole("link", { name: "Status Registrasi Giro", exact: true })
    .click();
  await expect(page).toHaveURL("/registration/giro/status");
  await page
    .getByLabel("Nomor Referensi Pengajuan")
    .fill(`  ${reference.toLowerCase()}  `);
  await page.getByRole("button", { name: "Cek Status", exact: true }).click();
  await expect(page).toHaveURL(
    `/registration/giro/status?reference=${reference}`,
  );
  await expect(
    page.getByRole("region", { name: "Hasil pelacakan" }),
  ).toContainText("Giro Rupiah");
  await page
    .getByLabel("Nomor Referensi Pengajuan")
    .fill("IND-COR-ABCDEF012345");
  await page.getByRole("button", { name: "Cek Status", exact: true }).click();
  await expect(page.locator("#reference-error")).toContainText("Giro");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page).toHaveURL("/registration/giro/status");
  await expect(page.getByLabel("Nomor Referensi Pengajuan")).toHaveValue("");
  await expect(
    page.getByRole("region", { name: "Hasil pelacakan" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Nomor Referensi Pengajuan")).toHaveValue("");
  await expect(
    page.getByRole("region", { name: "Hasil pelacakan" }),
  ).toHaveCount(0);
  await page.goto("/");
  await page
    .getByRole("link", { name: "Status Registrasi Giro", exact: true })
    .click();
  await expect(page).toHaveURL("/registration/giro/status");
  await page.goto("/");
  await page.getByRole("button", { name: "Buka menu" }).click();
  await page
    .getByRole("dialog", { name: "Navigasi" })
    .getByRole("link", { name: "Status Registrasi Giro", exact: true })
    .click();
  await expect(page).toHaveURL("/registration/giro/status");
  await page.goto("/");
  await page
    .locator(".tracking-section")
    .getByRole("link", { name: "Tracking", exact: true })
    .click();
  await expect(page).toHaveURL("/tracking");
});

test("giro status refreshes current status and hides cached results after failures", async ({
  page,
}) => {
  await login(page);
  const reference = "IND-GIR-ABCDEF012345";
  const record = giroStatusRecord(reference);
  let response: "initial" | "updated" | "failure" = "initial";
  await page.route(`**/api/registrations/giro/${reference}`, async (route) => {
    if (response === "failure") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Status terbaru belum dapat dimuat." }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        response === "initial"
          ? record
          : {
              ...record,
              status: "Disetujui",
              updatedAt: "2026-11-09T11:00:00.000Z",
              events: [
                ...record.events,
                {
                  id: "83b7635b-416e-42bd-8141-979478125e1f",
                  status: "Disetujui",
                  description: "Pengajuan Giro telah disetujui.",
                  createdAt: "2026-11-09T11:00:00.000Z",
                },
              ],
            },
      ),
    });
  });
  await page.goto(`/registration/giro/status?reference=${reference}`);
  const result = page.getByRole("region", { name: "Hasil pelacakan" });
  await expect(result.locator(".status-badge")).toHaveText("Diajukan");
  response = "updated";
  await page.getByRole("button", { name: "Cek Status", exact: true }).click();
  await expect(result.locator(".status-badge")).toHaveText("Disetujui");
  await expect(result).toContainText("Pengajuan Giro telah disetujui.");
  response = "failure";
  await page.getByRole("button", { name: "Cek Status", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Status terbaru belum dapat dimuat.",
  );
  await expect(result).toHaveCount(0);
});

test("giro status synchronizes normalized references with browser history", async ({
  page,
}) => {
  await login(page);
  const first = "IND-GIR-ABCDEF012345";
  const second = "NUSA-GIR-123456ABCDEF";
  await page.route("**/api/registrations/giro/*", async (route) => {
    const reference = new URL(route.request().url()).pathname
      .split("/")
      .at(-1)!;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(giroStatusRecord(reference)),
    });
  });
  await page.goto(
    `/registration/giro/status?reference=${encodeURIComponent(`  ${first.toLowerCase()}  `)}`,
  );
  const input = page.getByLabel("Nomor Referensi Pengajuan");
  const result = page.getByRole("region", { name: "Hasil pelacakan" });
  await expect(input).toHaveValue(first);
  await expect(result).toContainText(first);
  await input.fill(`  ${second.toLowerCase()}  `);
  await page.getByRole("button", { name: "Cek Status", exact: true }).click();
  await expect(page).toHaveURL(`/registration/giro/status?reference=${second}`);
  await expect(input).toHaveValue(second);
  await expect(result).toContainText(second);
  await page.goBack();
  await expect(input).toHaveValue(first);
  await expect(result).toContainText(first);
  await page.goForward();
  await expect(input).toHaveValue(second);
  await expect(result).toContainText(second);
});
test("tracking validates identifiers, shows missing state and clears searches", async ({
  page,
}) => {
  await login(page);
  await page.goto("/tracking");
  await page.getByLabel("Nomor Referensi Pengajuan").fill("invalid");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
  await expect(page.locator("#reference-error")).toBeVisible();
  await page
    .getByLabel("Nomor Referensi Pengajuan")
    .fill("NUSA-COR-000000000000");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("tidak ditemukan");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("carousel arrows, pagination, article detail and related links work", async ({
  page,
}) => {
  await page.goto("/");
  const dots = page.locator(".carousel-pagination button");
  await expect(dots).toHaveCount(4);
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Berita berikutnya" }).click();
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Berita sebelumnya" }).click();
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
  await dots.nth(3).click();
  await expect(dots.nth(3)).toHaveAttribute("aria-current", "true");
  await page.locator(".news-slide.is-active").click();
  await expect(page).toHaveURL(/\/news\//);
  await expect(page.locator("h1")).toHaveText(
    "Menyiapkan data sebelum registrasi",
  );
  await expect(page.locator(".article-cover")).toBeVisible();
  await expect(page.locator(".related-articles a")).toHaveCount(3);
  await page.locator(".related-articles a").first().click();
  await expect(page).toHaveURL(/\/news\/administrasi-perusahaan$/);
  await page.getByRole("link", { name: "Kembali ke Berita" }).click();
  await expect(page).toHaveURL(/#news$/);
});
test("footer destinations, help and privacy pages work", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("footer")
    .getByRole("link", { name: "Pusat Bantuan", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Pusat Bantuan");
  await page.goto("/");
  await page
    .locator("footer")
    .getByRole("link", { name: "Kebijakan Privasi", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Kebijakan Privasi");
  await page.goto("/");
  await page.locator('footer a[href="/help#contact"]').first().click();
  await expect(page).toHaveURL(/\/help#contact$/);
});
test("news failures support retry and expired sessions request a new login", async ({
  page,
}) => {
  await page.route("**/api/news", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Layanan sedang mengalami kendala." }),
    }),
  );
  await page.goto("/");
  await expect(page.locator("#news").getByRole("alert")).toBeVisible();
  await page.unroute("**/api/news");
  await page
    .locator("#news")
    .getByRole("button", { name: "Coba lagi" })
    .click();
  await expect(page.locator(".carousel-pagination button")).toHaveCount(4);
  await login(page);
  await page.route("**/api/tracking/*", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Sesi berakhir. Silakan masuk kembali.",
      }),
    }),
  );
  await page.goto("/tracking?reference=NUSA-COR-1234ABCD5678");
  await expect(
    page.getByRole("link", { name: "Masuk kembali untuk melanjutkan" }),
  ).toBeVisible();
});
test("desktop geometry follows reference and mobile/tablet pages never overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const hero = await page.locator(".hero").boundingBox();
  expect(hero?.x).toBe(36);
  expect(hero?.y).toBe(97);
  expect(hero?.width).toBe(1368);
  expect(hero?.height).toBe(692);
  const card = await page.locator(".login-card").boundingBox();
  expect(card?.width).toBe(400);
  expect(card?.x).toBe(904);
  await page.screenshot({ path: "artifacts/app-desktop.png", fullPage: true });
  for (const width of [320, 390, 600, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await expect(
      page.getByLabel("Corporate ID", { exact: true }),
    ).toBeVisible();
    if (width === 390)
      await page.screenshot({
        path: "artifacts/app-mobile.png",
        fullPage: true,
      });
    if (width === 768)
      await page.screenshot({
        path: "artifacts/app-tablet.png",
        fullPage: true,
      });
  }
  await login(page);
  await page.setViewportSize({ width: 320, height: 844 });
  for (const path of [
    "/dashboard",
    "/registration/corporate",
    "/registration/giro",
    "/tracking",
    "/help",
    "/privacy",
  ]) {
    await page.goto(path);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
});
