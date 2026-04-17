'use client';

import { useState, useMemo } from 'react';
import { Users, Search } from 'lucide-react';

interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  order_count: number;
  total_spent: number;
  last_order: string | null;
}

interface Props {
  customers: CustomerRow[];
  locale: string;
}

export function AdminCustomersClient({ customers, locale }: Props) {
  const [query, setQuery] = useState('');
  const isRTL = locale === 'ar';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q),
    );
  }, [customers, query]);

  const headers = isRTL
    ? ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الطلبات', 'إجمالي الإنفاق', 'آخر طلب', 'تاريخ التسجيل']
    : ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Last Order', 'Joined'];

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isRTL ? 'بحث بالاسم أو البريد أو الهاتف…' : 'Search by name, email or phone…'}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`w-full h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">
              {query
                ? (isRTL ? 'لا توجد نتائج' : 'No results found')
                : (isRTL ? 'لا يوجد عملاء بعد' : 'No customers yet')}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {headers.map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {c.order_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                    {c.total_spent > 0 ? `${c.total_spent.toLocaleString()} DZD` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.last_order ? new Date(c.last_order).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {query && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 px-1">
          {isRTL ? `${filtered.length} نتيجة` : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
}
