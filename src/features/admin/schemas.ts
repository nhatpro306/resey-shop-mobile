import { z } from "zod";

export const productFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(1, "Description is required"),
  material: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  // Empty input coerces to 0; treated as "no sale price" at submit time.
  sale_price: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
  sku: z.string().optional(),
  is_active: z.boolean().optional(),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;

export const storeSettingsSchema = z.object({
  store_name: z.string().optional(),
  slogan: z.string().optional(),
  announcement_text: z.string().optional(),
  hero_title: z.string().optional(),
  hero_subtitle: z.string().optional(),
  hero_image_url: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  instagram_url: z.string().optional(),
  tiktok_url: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
  shipping_fee: z.coerce.number().nonnegative().optional(),
  free_shipping_threshold: z.coerce.number().nonnegative().optional(),
});
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
