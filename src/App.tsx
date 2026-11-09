import { Route, Routes, Link } from "react-router-dom";
import { Header, Footer, ScrollManager, Page } from "./components/Layout";
import { Home } from "./pages/Home";
import { RequireAuth } from "./auth";
import { Registration } from "./pages/Registration";
import { Tracking } from "./pages/Tracking";
import { Recovery, LoginPage } from "./pages/Recovery";
import { NewsDetail } from "./pages/News";
import { Dashboard } from "./pages/Dashboard";
import { Help, Privacy, RedTiger } from "./pages/Information";
export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Lewati ke konten utama
      </a>
      <ScrollManager />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/token" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<Recovery />} />
        <Route
          path="/registration/corporate"
          element={
            <RequireAuth>
              <Registration key="corporate" kind="corporate" />
            </RequireAuth>
          }
        />
        <Route
          path="/registration/giro"
          element={
            <RequireAuth>
              <Registration key="giro" kind="giro" />
            </RequireAuth>
          }
        />
        <Route
          path="/registration/giro/status"
          element={
            <RequireAuth>
              <Tracking key="giro" giro />
            </RequireAuth>
          }
        />
        <Route
          path="/tracking"
          element={
            <RequireAuth>
              <Tracking key="all" />
            </RequireAuth>
          }
        />
        <Route path="/news/:slug" element={<NewsDetail />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/help" element={<Help />} />
        <Route path="/redtiger" element={<RedTiger />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="*"
          element={
            <Page title="Halaman Tidak Ditemukan">
              <Link className="button" to="/">
                Kembali ke Beranda
              </Link>
            </Page>
          }
        />
      </Routes>
      <Footer />
    </>
  );
}
