import { z } from "zod";

export const addressSchema = z.object({
  street: z.string().min(3, "Street is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  is_default: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const profileSchema = z.object({
  username: z.string().min(2, "Name must be at least 2 characters").max(40),
});
export type ProfileInput = z.infer<typeof profileSchema>;
