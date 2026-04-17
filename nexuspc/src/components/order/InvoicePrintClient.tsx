'use client';

import { useEffect } from 'react';
import { formatPrice } from '@/lib/utils';

interface OrderItem {
  product_id: string;
  product_name_en: string;
  product_name_ar: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  total: number;
  delivery_price?: number;
  full_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
}

export function InvoicePrintClient({ order, locale }: { order: Order; locale: string }) {
  const isRTL = locale === 'ar';

  useEffect(() => {
    // Auto-trigger print after a short delay so the page renders fully
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = order.delivery_price ?? (order.total - subtotal);
  const date = new Date(order.created_at).toLocaleDateString(
    isRTL ? 'ar-DZ' : 'en-GB',
    { day: '2-digit', month: 'long', year: 'numeric' },
  );

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${isRTL ? "'Cairo', Arial" : "'Segoe UI', Arial"}, sans-serif; background: #fff; color: #111; direction: ${isRTL ? 'rtl' : 'ltr'}; }

        .invoice { max-width: 780px; margin: 0 auto; padding: 40px; }

        /* Header */
        .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid #7c3aed; margin-bottom: 28px; }
        .brand-name { font-size: 28px; font-weight: 800; color: #7c3aed; letter-spacing: -1px; }
        .brand-sub  { font-size: 11px; color: #888; margin-top: 2px; }
        .invoice-title { text-align: ${isRTL ? 'left' : 'right'}; }
        .invoice-title h2 { font-size: 20px; font-weight: 700; color: #111; }
        .invoice-title p  { font-size: 12px; color: #666; margin-top: 4px; }
        .invoice-title .order-num { font-family: monospace; font-size: 14px; font-weight: 700; color: #7c3aed; margin-top: 6px; }

        /* Meta row */
        .meta { display: flex; gap: 16px; margin-bottom: 28px; }
        .meta-box { flex: 1; background: #f9f7ff; border: 1px solid #ede9fe; border-radius: 10px; padding: 14px 16px; }
        .meta-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #888; margin-bottom: 4px; }
        .meta-box .value { font-size: 13px; font-weight: 600; color: #111; }
        .meta-box .value.mono { font-family: monospace; }

        /* Items table */
        .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #888; margin-bottom: 10px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead tr { background: #7c3aed; }
        thead th { color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; padding: 10px 14px; text-align: ${isRTL ? 'right' : 'left'}; }
        thead th:last-child { text-align: ${isRTL ? 'left' : 'right'}; }
        tbody tr { border-bottom: 1px solid #f0f0f0; }
        tbody tr:last-child { border-bottom: none; }
        tbody td { font-size: 13px; padding: 11px 14px; color: #222; }
        tbody td.right { text-align: ${isRTL ? 'left' : 'right'}; font-weight: 600; }
        tbody td.center { text-align: center; }
        tbody tr:nth-child(even) { background: #fafafa; }

        /* Totals */
        .totals { display: flex; justify-content: ${isRTL ? 'flex-start' : 'flex-end'}; margin-bottom: 28px; }
        .totals-box { min-width: 240px; }
        .totals-row { display: flex; justify-content: space-between; gap: 24px; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
        .totals-row:last-child { border-bottom: none; border-top: 2px solid #7c3aed; margin-top: 4px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #7c3aed; }
        .totals-row .label { color: #666; }

        /* Payment badge */
        .paid-badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-bottom: 24px; }

        /* Footer */
        .footer { border-top: 1px solid #eee; padding-top: 16px; text-align: center; color: #aaa; font-size: 11px; }

        /* Hide site chrome on this page */
        header, footer { display: none !important; }
        main { padding: 0 !important; }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, footer { display: none !important; }
          .invoice { padding: 20px; }
        }
      `}</style>

      <div className="invoice">
        {/* Header */}
        <div className="header">
          <div>
            <div className="brand-name">NexusPC</div>
            <div className="brand-sub">{isRTL ? 'أفضل متجر لقطع الكمبيوتر في الجزائر' : "Algeria's #1 PC Parts Store"}</div>
          </div>
          <div className="invoice-title">
            <h2>{isRTL ? 'فاتورة دفع' : 'Payment Receipt'}</h2>
            <p>{date}</p>
            <p className="order-num">{order.order_number}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="meta">
          <div className="meta-box">
            <div className="label">{isRTL ? 'العميل' : 'Customer'}</div>
            <div className="value">{order.full_name}</div>
            <div className="value mono" style={{ marginTop: 2, fontSize: 12, color: '#666' }}>{order.phone}</div>
          </div>
          <div className="meta-box">
            <div className="label">{isRTL ? 'العنوان' : 'Delivery Address'}</div>
            <div className="value">{order.wilaya}</div>
            <div className="value" style={{ fontWeight: 400, color: '#555' }}>{order.commune}</div>
          </div>
          <div className="meta-box">
            <div className="label">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</div>
            <div className="value">
              {order.payment_method === 'online'
                ? (isRTL ? 'دفع إلكتروني (Chargily)' : 'Online — Chargily')
                : (isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery')}
            </div>
          </div>
        </div>

        {/* Paid badge */}
        <div className="paid-badge">
          {isRTL ? '✓ مدفوع' : '✓ PAID'}
        </div>

        {/* Items */}
        <div className="section-title">{isRTL ? 'تفاصيل الطلب' : 'Order Items'}</div>
        <table>
          <thead>
            <tr>
              <th>{isRTL ? 'المنتج' : 'Product'}</th>
              <th className="center">{isRTL ? 'الكمية' : 'Qty'}</th>
              <th>{isRTL ? 'السعر الوحدوي' : 'Unit Price'}</th>
              <th>{isRTL ? 'الإجمالي' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{isRTL ? item.product_name_ar : item.product_name_en}</td>
                <td className="center">{item.quantity}</td>
                <td>{formatPrice(item.price)}</td>
                <td className="right">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals">
          <div className="totals-box">
            <div className="totals-row">
              <span className="label">{isRTL ? 'المجموع الجزئي' : 'Subtotal'}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="totals-row">
              <span className="label">{isRTL ? 'رسوم التوصيل' : 'Delivery'}</span>
              <span>{deliveryFee === 0 ? (isRTL ? 'مجاني' : 'Free') : formatPrice(deliveryFee)}</span>
            </div>
            <div className="totals-row">
              <span>{isRTL ? 'المجموع الكلي' : 'Total'}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          {isRTL
            ? 'شكراً لتسوقك من NexusPC • nexuspc.dz'
            : 'Thank you for shopping with NexusPC • nexuspc.dz'}
        </div>

      </div>
    </>
  );
}
