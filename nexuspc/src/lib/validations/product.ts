import { z } from 'zod';

export const productSchema = z.object({
  name_en: z.string().min(2, 'Name (EN) must be at least 2 characters'),
  name_ar: z.string().min(2, 'Name (AR) must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers and hyphens only' }),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  compare_price: z.number().positive().optional().nullable(),
  stock_qty: z.number().int().min(0, 'Stock cannot be negative'),
  sku: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  images: z.array(z.string().url()).default([]),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  meta_title_en: z.string().optional().nullable(),
  meta_title_ar: z.string().optional().nullable(),
  meta_description_en: z.string().optional().nullable(),
  meta_description_ar: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
