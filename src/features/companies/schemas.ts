import { z } from "zod";

const companyName = z.string().trim().min(1, "Nama company wajib diisi");
const companyAddress = z.string().trim().min(1, "Alamat company wajib diisi");
const optionalText = z.string().trim().nullable().optional();

export const companySchema = z.object({
  id: z.string().uuid(),
  companyName,
  companyAddress,
  companyDescription: optionalText,
  companyBusiness: optionalText,
});

export const createCompanySchema = z
  .object({
    companyName,
    companyAddress,
    companyDescription: optionalText,
    companyBusiness: optionalText,
  })
  .strict();

export const updateCompanySchema = createCompanySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan");

export type CompanyRecord = z.infer<typeof companySchema>;
export type CreateCompanyPayload = z.infer<typeof createCompanySchema>;
export type UpdateCompanyPayload = z.infer<typeof updateCompanySchema>;
