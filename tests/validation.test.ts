import { describe, expect, it } from "vitest";
import {
  corporateSchema,
  giroSchema,
  giroReferenceSchema,
  loginSchema,
  referenceSchema,
} from "../shared/validation";
import { corporate } from "./fixtures";
describe("Shared validation", () => {
  it("normalizes company fields and phone numbers", () => {
    const result = corporateSchema.parse({
      ...corporate,
      companyName: " PT Nusa Contoh ",
      contactEmail: "OFFICE@example.test",
    });
    expect(result.companyName).toBe("PT Nusa Contoh");
    expect(result.phone).toBe("081234567890");
    expect(result.contactEmail).toBe("office@example.test");
  });
  it("rejects missing company details and consent", () => {
    expect(
      corporateSchema.safeParse({
        ...corporate,
        companyName: "",
        agreement: false,
      }).success,
    ).toBe(false);
  });
  it("requires a valid product for giro", () => {
    expect(
      giroSchema.safeParse({ ...corporate, productType: "Giro Rupiah" })
        .success,
    ).toBe(true);
    expect(
      giroSchema.safeParse({ ...corporate, productType: "" }).success,
    ).toBe(false);
  });
  it("trims login identifiers, keeps password unchanged, rejects empty fields", () => {
    expect(
      loginSchema.parse({
        corporateId: "jarwo ",
        userId: " demo ",
        password: "jarwo123!",
      }).corporateId,
    ).toBe("jarwo");
    expect(
      loginSchema.safeParse({ corporateId: "", userId: "", password: "" })
        .success,
    ).toBe(false);
  });
  it("accepts generated references and rejects malformed lookups", () => {
    expect(
      referenceSchema.parse({ reference: "ind-gir-1234abcd5678" }).reference,
    ).toBe("IND-GIR-1234ABCD5678");
    expect(
      referenceSchema.parse({ reference: "nusa-gir-1234abcd5678" }).reference,
    ).toBe("NUSA-GIR-1234ABCD5678");
    expect(referenceSchema.safeParse({ reference: "123" }).success).toBe(false);
  });
  it.each(["IND", "NUSA"])(
    "normalizes %s Giro references for status lookup",
    (prefix) => {
      expect(
        giroReferenceSchema.parse({
          reference: `  ${prefix.toLowerCase()}-gir-1234abcd5678  `,
        }).reference,
      ).toBe(`${prefix}-GIR-1234ABCD5678`);
    },
  );
  it("rejects corporate references only in Giro status lookup", () => {
    for (const prefix of ["IND", "NUSA"]) {
      const input = { reference: `${prefix}-COR-1234ABCD5678` };
      expect(referenceSchema.safeParse(input).success).toBe(true);
      const result = giroReferenceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toBe(
          "Masukkan nomor referensi Giro (IND-GIR atau NUSA-GIR).",
        );
    }
  });
  it("rejects malformed Giro references", () => {
    expect(
      giroReferenceSchema.safeParse({ reference: "IND-GIR-1234ABCD567Z" })
        .success,
    ).toBe(false);
    expect(giroReferenceSchema.safeParse({ reference: "" }).success).toBe(
      false,
    );
  });
});
