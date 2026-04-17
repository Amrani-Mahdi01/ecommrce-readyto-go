import { z } from 'zod';

const algerianPhone = z
  .string()
  .regex(/^0[567]\d{8}$/, 'Phone must be a valid Algerian number starting with 05, 06, or 07');

export const checkoutSchema = z.object({
  customer_name: z.string().min(3, 'Full name must be at least 3 characters'),
  phone: algerianPhone,
  wilaya_code: z.string().min(1, 'Please select a wilaya'),
  wilaya_name: z.string().min(1, 'Wilaya name is required'),
  commune: z.string().min(2, 'Commune must be at least 2 characters'),
  notes: z.string().optional(),
});

export const trackOrderSchema = z.object({
  order_number: z
    .string()
    .regex(/^NPC-\d{6}$/, 'Order number must be in format NPC-XXXXXX'),
  phone: algerianPhone,
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
export type TrackOrderFormValues = z.infer<typeof trackOrderSchema>;
