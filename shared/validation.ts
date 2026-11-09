import { z } from "zod";
const required = (label: string, min = 2) =>
  z
    .string()
    .trim()
    .min(min, `${label} wajib diisi (minimal ${min} karakter).`)
    .max(160, "Maksimal 160 karakter.");
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^(?:\+62|62|0)[0-9]{8,13}$/,
        "Masukkan nomor telepon Indonesia yang valid.",
      ),
  );
const base = {
  companyName: required("Nama perusahaan"),
  businessType: z.enum(
    ["PT", "CV", "Koperasi", "Yayasan", "Usaha Perseorangan"],
    { error: "Pilih jenis usaha." },
  ),
  contactEmail: z
    .email("Masukkan alamat email yang valid.")
    .trim()
    .toLowerCase()
    .max(254),
  contactName: required("Nama kontak"),
  phone,
  city: required("Kota"),
  agreement: z
    .boolean()
    .refine((value) => value, "Persetujuan wajib dicentang."),
};
export const corporateSchema = z.object({
  ...base,
  address: required("Alamat usaha", 5).max(500),
  province: required("Provinsi"),
});
export const giroSchema = z.object({
  ...base,
  productType: z.enum(["Giro Rupiah", "Giro Valas"], {
    error: "Pilih jenis produk.",
  }),
});
export const loginSchema = z.object({
  corporateId: required("Corporate ID", 3).max(64),
  userId: required("User ID", 3).max(64),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter.")
    .max(128, "Kata sandi maksimal 128 karakter."),
});
export const recoverySchema = z.object({
  email: z
    .email("Masukkan alamat email yang valid.")
    .trim()
    .toLowerCase()
    .max(254),
});
export const referenceSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^(?:IND|NUSA)-(?:COR|GIR)-[A-F0-9]{12}$/,
      "Masukkan nomor referensi IND-COR atau IND-GIR yang diterima saat pengajuan.",
    ),
});
export const giroReferenceSchema = referenceSchema.extend({
  reference: referenceSchema.shape.reference.refine(
    (value) => /^(?:IND|NUSA)-GIR-/.test(value),
    "Masukkan nomor referensi Giro (IND-GIR atau NUSA-GIR).",
  ),
});
export type LoginInput = z.input<typeof loginSchema>;
export type CorporateInput = z.input<typeof corporateSchema>;
export type GiroInput = z.input<typeof giroSchema>;
