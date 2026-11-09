// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../src/auth";
import { LoginForm } from "../src/components/LoginForm";
import { Header } from "../src/components/Layout";
import { Help, RedTiger } from "../src/pages/Information";
beforeEach(() => {
  cleanup();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ user: null, csrfToken: "test" }),
    })),
  );
});
function mount(component: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <AuthProvider>{component}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
describe("Interactive components", () => {
  it("blocks empty login and toggles password visibility using accessible controls", async () => {
    const user = userEvent.setup();
    mount(<LoginForm />);
    expect(screen.getByRole("button", { name: "Masuk" })).toBeDisabled();
    await user.type(screen.getByLabelText("Corporate ID"), "jarwo");
    await user.type(screen.getByLabelText("User ID"), "jarwo");
    await user.type(screen.getByLabelText("Kata Sandi"), "jarwo123!");
    expect(screen.getByRole("button", { name: "Masuk" })).toBeEnabled();
    expect(screen.getByLabelText("Kata Sandi")).toHaveAttribute(
      "type",
      "password",
    );
    await user.click(
      screen.getByRole("button", { name: "Tampilkan kata sandi" }),
    );
    expect(screen.getByLabelText("Kata Sandi")).toHaveAttribute("type", "text");
  });
  it("opens navigation and closes with Escape while restoring focus", async () => {
    const user = userEvent.setup();
    mount(<Header />);
    const toggle = screen.getByRole("button", { name: "Buka menu" });
    await user.click(toggle);
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByRole("link", { name: "Beranda" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });
  it("does not display account credentials on the help page", () => {
    mount(<Help />);
    expect(screen.getByRole("heading", { name: "Akses Akun" })).toBeVisible();
    expect(
      screen.getByText(/kredensial yang diberikan administrator/i),
    ).toBeVisible();
    expect(screen.queryByText("JarwoCorp")).not.toBeInTheDocument();
    expect(screen.queryByText("jarwo123!")).not.toBeInTheDocument();
  });
  it("shows only separate RedTiger terminal instructions", () => {
    mount(<RedTiger />);
    expect(screen.getByRole("heading", { name: "RedTiger" })).toBeVisible();
    expect(
      screen.getByRole("main").querySelector("pre code")?.textContent,
    ).toBe(
      String.raw`cd "C:\Users\SAMUEL\OneDrive\ドキュメント\RedTiger-Tools-main\RedTiger-Tools-main"
.\.venv\Scripts\python.exe .\redtiger.py`,
    );
    expect(
      screen
        .getByRole("main")
        .querySelectorAll(".prose a, .prose button, .prose form, .prose input"),
    ).toHaveLength(0);
  });
});
