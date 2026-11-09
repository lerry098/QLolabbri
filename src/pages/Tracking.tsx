import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { giroReferenceSchema, referenceSchema } from "../../shared/validation";
import type { Application } from "../../shared/models";
import { api, ApiError } from "../api";
import { Page } from "../components/Layout";
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
export function SessionError({ error }: { error: Error }) {
  return (
    <div className="notice error" role="alert">
      {error.message}
      {error instanceof ApiError && error.status === 401 && (
        <p>
          <Link className="text-button" to="/login">
            Masuk kembali untuk melanjutkan
          </Link>
        </p>
      )}
    </div>
  );
}
export function ApplicationResult({ record }: { record: Application }) {
  return (
    <section
      className="result-panel"
      aria-label="Hasil pelacakan"
      aria-live="polite"
    >
      <h2>{record.companyName}</h2>
      <p className="reference-number">{record.referenceNumber}</p>
      <span className="status-badge">{record.status}</span>
      <dl className="record-meta">
        <div>
          <dt>Layanan</dt>
          <dd>
            {record.kind === "giro" ? record.productType : "Cash Management"}
          </dd>
        </div>
        <div>
          <dt>Tanggal Pengajuan</dt>
          <dd>{formatDate(record.createdAt)}</dd>
        </div>
        <div>
          <dt>Pembaruan Terakhir</dt>
          <dd>{formatDate(record.updatedAt)}</dd>
        </div>
        <div>
          <dt>Kota</dt>
          <dd>{record.city}</dd>
        </div>
      </dl>
      <ol className="timeline" aria-label="Riwayat pengajuan">
        {record.events.map((event) => (
          <li key={event.id}>
            <strong>{event.status}</strong>
            <time dateTime={event.createdAt}>
              {formatDate(event.createdAt)}
            </time>
            <p>{event.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function Tracking({ giro = false }: { giro?: boolean }) {
  const [params, setParams] = useSearchParams();
  const initial = params.get("reference") || "";
  const schema = giro ? giroReferenceSchema : referenceSchema;
  const parsed = schema.safeParse({ reference: initial });
  const reference = parsed.success ? parsed.data.reference : "";
  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<{ reference: string }>({
    resolver: zodResolver(schema),
    defaultValues: { reference: reference || initial },
  });
  useEffect(() => {
    reset({ reference: reference || initial });
    if (initial && !reference) void trigger("reference");
  }, [initial, reference, reset, trigger]);
  const query = useQuery({
    queryKey: ["tracking", giro, reference],
    queryFn: () => api.tracking(reference, giro),
    enabled: !!reference,
    retry: false,
  });
  return (
    <Page
      title={giro ? "Status Registrasi Giro" : "Tracking"}
      intro={
        giro
          ? "Periksa status pengajuan Giro Anda menggunakan nomor referensi yang diterima setelah registrasi."
          : "Cari pengajuan milik akun Anda menggunakan nomor referensi yang diterima saat registrasi."
      }
    >
      <form
        className="search-form"
        aria-label={giro ? "Cek status registrasi Giro" : "Cari pengajuan"}
        onSubmit={handleSubmit((value) => {
          if (initial !== value.reference) {
            const next = new URLSearchParams(params);
            next.set("reference", value.reference);
            setParams(next);
          }
          if (reference === value.reference) void query.refetch();
        })}
        noValidate
      >
        <div className="form-field">
          <label htmlFor="reference">Nomor Referensi Pengajuan</label>
          <input
            id="reference"
            placeholder={giro ? "IND-GIR-XXXXXXXXXXXX" : "IND-COR-XXXXXXXXXXXX"}
            {...register("reference")}
            aria-invalid={!!errors.reference}
            aria-describedby={errors.reference ? "reference-error" : undefined}
          />
          {errors.reference && (
            <p id="reference-error" className="field-error">
              {errors.reference.message}
            </p>
          )}
        </div>
        <button type="submit" className="button" disabled={query.isFetching}>
          {query.isFetching
            ? giro
              ? "Mengecek…"
              : "Mencari…"
            : giro
              ? "Cek Status"
              : "Cari"}
        </button>
        <button
          type="button"
          className="outline-button"
          onClick={() => {
            reset({ reference: "" });
            if (params.has("reference")) {
              const next = new URLSearchParams(params);
              next.delete("reference");
              setParams(next, { replace: true });
            }
          }}
        >
          Reset
        </button>
      </form>
      {query.isFetching && <p role="status">Mencari pengajuan…</p>}
      {query.error && <SessionError error={query.error} />}
      {!query.isFetching && !query.error && reference && query.data && (
        <ApplicationResult record={query.data} />
      )}
      {!reference && (
        <p className="notice">
          Hanya pengajuan {giro ? "Giro " : ""}yang dibuat oleh akun Anda yang
          dapat ditampilkan.
        </p>
      )}
    </Page>
  );
}
