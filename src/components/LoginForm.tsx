import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "../../shared/validation";
import { appName } from "../../shared/brand";
import { api } from "../api";
import { useAuth } from "../auth";
export function LoginForm() {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { corporateId: "", userId: "", password: "" },
  });
  const values = watch();
  async function submit(value: LoginInput) {
    setError("");
    try {
      await api.login(value);
      await refresh();
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form
      id="login"
      className="login-card"
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-label="Masuk Nusa Corporate"
    >
      <h2>LOGIN</h2>
      <div className="login-field">
        <div className="login-label-row">
          <label htmlFor="corporateId">Corporate ID</label>
          <button
            type="button"
            className="info-button"
            aria-label="Informasi akun Nusa Corporate"
            aria-expanded={info}
            aria-controls="login-info"
            onClick={() => setInfo((v) => !v)}
          >
            <Info size={20} />
          </button>
        </div>
        {info && (
          <p className="login-info" id="login-info">
            Gunakan akun {appName} saja.
            <Link to="/help#">Pusat Bantuan</Link>.Gunakan kredensial bank.
          </p>
        )}
        <input
          id="corporateId"
          placeholder="Masukkan Corporate ID Anda"
          autoComplete="organization"
          {...register("corporateId")}
          aria-invalid={!!errors.corporateId}
          aria-describedby={
            errors.corporateId ? "corporateId-error" : undefined
          }
        />
        {errors.corporateId && (
          <p id="corporateId-error" className="login-error">
            {errors.corporateId.message}
          </p>
        )}
      </div>
      <div className="login-field">
        <label htmlFor="userId">User ID</label>
        <input
          id="userId"
          placeholder="Masukkan user ID anda"
          autoComplete="username"
          {...register("userId")}
          aria-invalid={!!errors.userId}
          aria-describedby={errors.userId ? "userId-error" : undefined}
        />
        {errors.userId && (
          <p id="userId-error" className="login-error">
            {errors.userId.message}
          </p>
        )}
      </div>
      <div className="login-field">
        <label htmlFor="password">Kata Sandi</label>
        <div className="password-control">
          <input
            id="password"
            type={visible ? "text" : "password"}
            placeholder="Masukkan kata sandi anda"
            autoComplete="current-password"
            {...register("password")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <button
            type="button"
            aria-label={
              visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <Eye /> : <EyeOff />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="login-error">
            {errors.password.message}
          </p>
        )}
      </div>
      <Link className="forgot-link" to="/forgot-password">
        LUPA KATA SANDI?
      </Link>
      {error && (
        <p role="alert" className="login-error">
          {error}
        </p>
      )}
      <button
        className="login-submit"
        disabled={
          !values.corporateId.trim() ||
          !values.userId.trim() ||
          !values.password ||
          isSubmitting
        }
      >
        {isSubmitting ? "Memprosesâ€¦" : "Masuk"}
      </button>
    </form>
  );
}
