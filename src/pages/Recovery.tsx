import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appName, bankTitle } from "../../shared/brand";
import { recoverySchema } from "../../shared/validation";
import { Page } from "../components/Layout";
import { LoginForm } from "../components/LoginForm";
import { api } from "../api";
export function LoginPage() {
  return (
    <Page
      title={`Masuk ${appName}`}
      intro={`Masuk dengan akun aplikasi ${appName} untuk melanjutkan. Jangan gunakan Corporate ID, User ID, atau kata sandi perbankan.`}
    >
      <div className="login-page-panel">
        <LoginForm />
      </div>
      <p className="notice">
        Untuk lingkungan lokal, lihat{" "}
        <Link className="text-button" to={`/help#${bankTitle}`}>
          informasi akun {bankTitle}
        </Link>
        .
      </p>
    </Page>
  );
}
export function Recovery() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(recoverySchema) });
  return (
    <Page
      title="Lupa Kata Sandi"
      intro={`Ajukan bantuan pemulihan untuk akun ${appName} Anda.`}
    >
      {message ? (
        <div className="notice success" role="status">
          {message}
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit(async (value) => {
            setError("");
            try {
              const result = await api.forgot(value);
              setMessage(result.message);
            } catch (e) {
              setError((e as Error).message);
            }
          })}
        >
          <div className="form-field">
            <label htmlFor="email">Email Akun</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p className="field-error" id="email-error">
                {errors.email.message}
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="notice error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="button" disabled={isSubmitting}>
              {isSubmitting ? "Mengirim…" : "Kirim Permintaan"}
            </button>
          </div>
        </form>
      )}
      <div className="form-actions">
        <Link className="outline-button" to="/login">
          Kembali ke Login
        </Link>
      </div>
    </Page>
  );
}
