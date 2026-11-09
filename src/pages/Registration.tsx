import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  corporateSchema,
  giroSchema,
  type CorporateInput,
  type GiroInput,
} from "../../shared/validation";
import type { Application, RegistrationKind } from "../../shared/models";
import { appName, bankUpper } from "../../shared/brand";
import { api } from "../api";
import { Page } from "../components/Layout";
import { SessionError } from "./Tracking";
type Values = CorporateInput & Partial<Pick<GiroInput, "productType">>;
export function Registration({ kind }: { kind: RegistrationKind }) {
  const isGiro = kind === "giro";
  const [result, setResult] = useState<Application>();
  const [error, setError] = useState<Error>();
  const client = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(isGiro ? giroSchema : corporateSchema) as never,
    mode: "onTouched",
    defaultValues: { agreement: false },
  });
  const fields: {
    name: keyof Values;
    label: string;
    type?: string;
    options?: string[];
  }[] = [
    { name: "companyName", label: "Nama Perusahaan" },
    {
      name: "businessType",
      label: "Jenis Usaha",
      options: ["PT", "CV", "Koperasi", "Yayasan", "Usaha Perseorangan"],
    },
    { name: "contactEmail", label: "Email Perusahaan", type: "email" },
    { name: "contactName", label: isGiro ? "Nama Kontak" : "Penanggung Jawab" },
    { name: "phone", label: "Nomor Telepon", type: "tel" },
    ...(isGiro
      ? [
          {
            name: "productType" as const,
            label: "Jenis Produk",
            options: ["Giro Rupiah", "Giro Valas"],
          },
        ]
      : [{ name: "address" as const, label: "Alamat Usaha" }]),
    { name: "city", label: "Kota" },
    ...(!isGiro ? [{ name: "province" as const, label: "Provinsi" }] : []),
  ];
  async function submit(value: Values) {
    setError(undefined);
    try {
      const saved = await api.register(kind, value);
      setResult(saved);
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setError(e as Error);
    }
  }
  return (
    <Page
      title={`Registrasi ${isGiro ? `Giro ${bankUpper}` : "Cash Management"}`}
      intro={`Lengkapi informasi perusahaan untuk membuat pengajuan pada ${appName}.`}
    >
      {result ? (
        <div role="status" className="notice success">
          <h2>Pengajuan berhasil disimpan</h2>
          <p>Nomor referensi pengajuan Anda:</p>
          <output className="reference-number">{result.referenceNumber}</output>
          <p>
            Status awal: {result.status}. Simpan nomor ini untuk memantau
            pengajuan.
          </p>
          <div className="form-actions">
            <Link
              className="button"
              to={`${isGiro ? "/registration/giro/status" : "/tracking"}?reference=${result.referenceNumber}`}
            >
              Lihat Status Pengajuan
            </Link>
            <Link className="outline-button" to="/dashboard">
              Ke Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(submit)}
          noValidate
          aria-label={`Form registrasi ${kind}`}
        >
          <fieldset
            disabled={isSubmitting}
            className="border-0 p-0 m-0 min-w-0"
          >
            <div className="form-grid">
              {fields.map((field) => (
                <div className="form-field" key={field.name}>
                  <label htmlFor={field.name}>
                    {field.label} <span aria-hidden="true">*</span>
                  </label>
                  {field.options ? (
                    <select
                      id={field.name}
                      {...register(field.name)}
                      aria-required="true"
                      aria-invalid={!!errors[field.name]}
                      aria-describedby={
                        errors[field.name] ? `${field.name}-error` : undefined
                      }
                    >
                      <option value="">
                        Pilih {field.label.toLowerCase()}
                      </option>
                      {field.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.name === "address" ? (
                    <textarea
                      id={field.name}
                      {...register(field.name)}
                      aria-required="true"
                      aria-invalid={!!errors[field.name]}
                      aria-describedby={
                        errors[field.name] ? `${field.name}-error` : undefined
                      }
                    />
                  ) : (
                    <input
                      id={field.name}
                      type={field.type || "text"}
                      {...register(field.name)}
                      aria-required="true"
                      aria-invalid={!!errors[field.name]}
                      aria-describedby={
                        errors[field.name] ? `${field.name}-error` : undefined
                      }
                    />
                  )}
                  {errors[field.name] && (
                    <p className="field-error" id={`${field.name}-error`}>
                      {(errors as FieldErrors<Values>)[field.name]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <label className="agreement">
              <input
                type="checkbox"
                {...register("agreement")}
                aria-invalid={!!errors.agreement}
                aria-describedby={
                  errors.agreement ? "agreement-error" : undefined
                }
              />
              <span>
                Saya menyetujui <Link to="/privacy">Kebijakan Privasi</Link> dan
                menyatakan informasi yang diberikan benar. Pengajuan ini
                disimpan di aplikasi {appName}.
              </span>
            </label>
            {errors.agreement && (
              <p className="field-error" id="agreement-error">
                {errors.agreement.message}
              </p>
            )}
            {error && <SessionError error={error} />}
            <div className="form-actions">
              <button className="button" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : "Kirim Pengajuan"}
              </button>
              <Link className="outline-button" to="/">
                Batal
              </Link>
            </div>
          </fieldset>
        </form>
      )}
    </Page>
  );
}
