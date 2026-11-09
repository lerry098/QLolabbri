import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useAuth } from "../auth";
import { Page } from "../components/Layout";
import { SessionError, formatDate } from "./Tracking";
export function Dashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
    retry: false,
  });
  const { clear } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState<Error>();
  const [leaving, setLeaving] = useState(false);
  async function logout() {
    setLeaving(true);
    setLogoutError(undefined);
    try {
      await api.logout();
      clear();
      navigate("/login", { replace: true });
    } catch (e) {
      setLogoutError(e as Error);
    } finally {
      setLeaving(false);
    }
  }
  if (query.isPending)
    return (
      <Page title="Dashboard">
        <p role="status">Memuat dashboard…</p>
      </Page>
    );
  if (query.error)
    return (
      <Page title="Dashboard">
        <SessionError error={query.error} />
        <button className="button" onClick={() => void query.refetch()}>
          Coba lagi
        </button>
      </Page>
    );
  const { user, applications, notifications } = query.data;
  const activity = applications
    .flatMap((record) =>
      record.events.map((event) => ({
        ...event,
        reference: record.referenceNumber,
      })),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  return (
    <Page title="Dashboard" intro={`Selamat datang, ${user.name}.`}>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar" aria-label="Menu dashboard">
          <Link to="/dashboard" aria-current="page">
            Ringkasan
          </Link>
          <Link to="/registration/corporate">Registrasi Cash Management</Link>
          <Link to="/registration/giro">Registrasi Giro</Link>
          <Link to="/registration/giro/status">Status Registrasi Giro</Link>
          <Link to="/tracking">Tracking</Link>
          <Link to="/help">Bantuan</Link>
          <button
            className="outline-button"
            onClick={() => void logout()}
            disabled={leaving}
          >
            {leaving ? "Keluar…" : "Keluar"}
          </button>
        </aside>
        <div className="dashboard-content">
          {logoutError && <SessionError error={logoutError} />}
          <div className="summary-grid">
            <div className="summary-card">
              <strong>{applications.length}</strong>Total Pengajuan
            </div>
            <div className="summary-card">
              <strong>
                {
                  applications.filter(
                    (a) => !["Disetujui", "Selesai"].includes(a.status),
                  ).length
                }
              </strong>
              Dalam Proses
            </div>
            <div className="summary-card">
              <strong>
                {
                  applications.filter((a) =>
                    ["Disetujui", "Selesai"].includes(a.status),
                  ).length
                }
              </strong>
              Disetujui / Selesai
            </div>
          </div>
          <section>
            <h2>Profil Akun</h2>
            <p>
              {user.name} · {user.corporateId} / {user.userId}
            </p>
            <p>{user.email}</p>
          </section>
          <section>
            <h2>Status Registrasi</h2>
            {applications.length ? (
              <div className="application-list">
                {applications.map((record) => (
                  <Link
                    className="application-link"
                    key={record.id}
                    to={`${record.kind === "giro" ? "/registration/giro/status" : "/tracking"}?reference=${record.referenceNumber}`}
                  >
                    <strong>{record.companyName}</strong>
                    <span>
                      {record.referenceNumber} · {record.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="notice">
                Belum ada pengajuan.{" "}
                <Link className="text-button" to="/registration/corporate">
                  Buat pengajuan pertama
                </Link>
                .
              </p>
            )}
          </section>
          <section>
            <h2>Aktivitas Terbaru</h2>
            {activity.length ? (
              <ul className="activity-list">
                {activity.map((event) => (
                  <li key={event.id}>
                    {event.reference} — {event.status}
                    <br />
                    <time dateTime={event.createdAt}>
                      {formatDate(event.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Belum ada aktivitas.</p>
            )}
          </section>
          <section>
            <h2>Notifikasi</h2>
            {notifications.length ? (
              <ul className="activity-list">
                {notifications.map((n) => (
                  <li key={n.id}>
                    {n.message}
                    <br />
                    <time dateTime={n.createdAt}>
                      {formatDate(n.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Tidak ada notifikasi baru.</p>
            )}
          </section>
        </div>
      </div>
    </Page>
  );
}
