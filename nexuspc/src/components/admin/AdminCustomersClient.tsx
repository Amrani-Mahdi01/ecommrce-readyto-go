'use client';

import { useState, useMemo } from 'react';
import { Users, Search, ShieldX, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { unblockIp } from '@/app/actions/place-order';

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

interface BlockedIp {
  ip: string;
  reason: string | null;
  blocked_by: string;
  created_at: string;
}

interface Props {
  customers: CustomerRow[];
  blockedIps: BlockedIp[];
  locale: string;
}

export function AdminCustomersClient({ customers, blockedIps: initialBlockedIps, locale }: Props) {
  const [tab, setTab] = useState<'customers' | 'blocked'>('customers');
  const [query, setQuery] = useState('');
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>(initialBlockedIps);
  const [unblocking, setUnblocking] = useState<string | null>(null);
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

  const filteredBlocked = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blockedIps;
    return blockedIps.filter(b => b.ip.includes(q) || b.reason?.toLowerCase().includes(q));
  }, [blockedIps, query]);

  const handleUnblock = async (ip: string) => {
    setUnblocking(ip);
    const { error } = await unblockIp(ip);
    setUnblocking(null);
    if (error) { toast.error(error); return; }
    setBlockedIps(prev => prev.filter(b => b.ip !== ip));
    toast.success(isRTL ? 'تم رفع الحظر عن عنوان IP' : `IP ${ip} unblocked`);
  };

  const customerHeaders = isRTL
    ? ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الطلبات', 'إجمالي الإنفاق', 'آخر طلب', 'تاريخ التسجيل']
    : ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Last Order', 'Joined'];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 mb-5 border-b border-border/60">
        <button
          onClick={() => setTab('customers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            tab === 'customers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          {isRTL ? 'العملاء' : 'Customers'}
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
            {customers.length}
          </span>
        </button>
        <button
          onClick={() => setTab('blocked')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            tab === 'blocked'
              ? 'border-destructive text-destructive'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldX className="h-4 w-4" />
          {isRTL ? 'عناوين IP المحظورة' : 'Blocked IPs'}
          {blockedIps.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">
              {blockedIps.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === 'customers'
              ? (isRTL ? 'بحث بالاسم أو البريد أو الهاتف…' : 'Search by name, email or phone…')
              : (isRTL ? 'بحث بعنوان IP أو السبب…' : 'Search by IP or reason…')
          }
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`w-full h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
        />
      </div>

      {/* ── Customers tab ── */}
      {tab === 'customers' && (
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
                  {customerHeaders.map((h) => (
                    <th key={h} className={`px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>
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
      )}

      {/* ── Blocked IPs tab ── */}
      {tab === 'blocked' && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {filteredBlocked.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShieldCheck className="h-12 w-12 text-emerald-500/40 mx-auto" />
              <p className="text-muted-foreground text-sm font-medium">
                {query
                  ? (isRTL ? 'لا توجد نتائج' : 'No results found')
                  : (isRTL ? 'لا توجد عناوين IP محظورة' : 'No blocked IP addresses')}
              </p>
              {!query && (
                <p className="text-xs text-muted-foreground/60">
                  {isRTL
                    ? 'يتم الحظر تلقائياً عند إلغاء 3 طلبات من نفس العنوان'
                    : 'IPs are auto-blocked after 3 cancelled orders'}
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  {(isRTL
                    ? ['عنوان IP', 'السبب', 'بواسطة', 'تاريخ الحظر', 'إجراء']
                    : ['IP Address', 'Reason', 'Blocked By', 'Date Blocked', 'Action']
                  ).map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBlocked.map((entry) => (
                  <tr key={entry.ip} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <span className="font-mono text-xs text-destructive font-semibold">{entry.ip}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {entry.reason ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        entry.blocked_by === 'system'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {entry.blocked_by === 'system'
                          ? (isRTL ? 'تلقائي' : 'Auto')
                          : (isRTL ? 'يدوي' : 'Manual')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString(
                        isRTL ? 'ar-DZ' : 'en-GB',
                        { year: 'numeric', month: 'short', day: 'numeric' },
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleUnblock(entry.ip)}
                        disabled={unblocking === entry.ip}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors disabled:opacity-50"
                      >
                        {unblocking === entry.ip
                          ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
                          : <ShieldCheck className="h-3.5 w-3.5" />}
                        {isRTL ? 'رفع الحظر' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Result count */}
      {query && (
        <p className="text-xs text-muted-foreground mt-2 px-1">
          {tab === 'customers'
            ? (isRTL ? `${filtered.length} نتيجة` : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`)
            : (isRTL ? `${filteredBlocked.length} نتيجة` : `${filteredBlocked.length} result${filteredBlocked.length !== 1 ? 's' : ''}`)}
        </p>
      )}
    </div>
  );
}
