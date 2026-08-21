/**
 * components/admin/PaymentsTable.jsx
 * Paginated, searchable, filterable payments data table. Filtering is
 * server-side (see GET /api/admin/payments); search is debounced.
 */

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  formatCurrency, formatDate, getStatusBadgeClass, downloadBlob, downloadErrorMessage,
} from '../../lib/utils';
import { adminApi } from '../../lib/api';
import FilterBar from './FilterBar';

const BLANK = { search: '', status: '', method: '', currency: '', date_from: '', date_to: '' };

export default function PaymentsTable({ payments, total, totalPages, page, loading, onFilter, onPageChange }) {
  const [filters, setFilters] = useState(BLANK);
  // id of the row whose PDF is being built, so only that row shows progress.
  const [pdfRowId, setPdfRowId] = useState(null);

  const downloadReceipt = async (payment) => {
    setPdfRowId(payment.id);
    try {
      const { data } = await adminApi.paymentPdf(payment.id);
      downloadBlob(data, `AMC2027-receipt-${payment.registration_ref}-${payment.id}.pdf`);
    } catch (err) {
      toast.error(await downloadErrorMessage(err, 'Failed to generate receipt.'));
    } finally {
      setPdfRowId(null);
    }
  };

  const debounce = useRef(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => onFilter({ ...filters, page: 1 }), 350);
    return () => clearTimeout(debounce.current);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const active = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      <FilterBar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search ref, name, email or gateway reference…"
        selects={[
          {
            label: 'Status',
            value: filters.status,
            onChange: (v) => setFilter('status', v),
            options: [
              { value: '', label: 'All statuses' },
              // 'unpaid' = registered but never started a payment.
              { value: 'unpaid', label: 'Not started' },
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
            ],
          },
          {
            label: 'Method',
            value: filters.method,
            onChange: (v) => setFilter('method', v),
            options: [
              { value: '', label: 'All methods' },
              { value: 'ecocash', label: 'EcoCash' },
              { value: 'paynow', label: 'Paynow' },
              { value: 'visa', label: 'Visa' },
              { value: 'mastercard', label: 'Mastercard' },
              { value: 'telecash', label: 'Telecash' },
              { value: 'bank', label: 'Bank transfer' },
            ],
          },
          {
            label: 'Currency',
            value: filters.currency,
            onChange: (v) => setFilter('currency', v),
            options: [
              { value: '', label: 'All currencies' },
              { value: 'USD', label: 'USD' },
              { value: 'ZWL', label: 'ZWL' },
            ],
          },
        ]}
        dateRange={{
          label: 'Payment date',
          from: filters.date_from,
          to: filters.date_to,
          onFromChange: (v) => setFilter('date_from', v),
          onToChange: (v) => setFilter('date_to', v),
        }}
        active={active}
        onReset={() => setFilters(BLANK)}
        summary={active ? `${total} registrations match these filters` : `${total} registrations`}
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[52rem]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Ref','Name','Category','Paid','Total Due','Balance','Method','Currency','Status','Date','Receipt'].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="py-8 text-center text-gray-400">Loading…</td></tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400">
                  {active ? 'No payments match these filters.' : 'No payments found.'}
                </td>
              </tr>
            ) : payments.map((p) => (
              // Rows are one per registration, so key off the registrant —
              // p.id is null for anyone who never started a payment.
              <tr key={p.registrant_row_id ?? p.registrant_id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs text-navy font-semibold">{p.registration_ref}</td>
                <td className="py-3 px-4 whitespace-nowrap">{p.designation} {p.first_name} {p.last_name}</td>
                <td className="py-3 px-4">{p.category}</td>
                <td className="py-3 px-4 font-semibold">
                  {formatCurrency(p.status === 'paid' ? p.amount : 0)}
                </td>
                <td className="py-3 px-4 font-semibold">{formatCurrency(p.grand_total || 0)}</td>
                <td className={`py-3 px-4 font-semibold ${Number(p.balance_due) > 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {formatCurrency(p.balance_due ?? 0)}
                </td>
                <td className="py-3 px-4 capitalize">
                  {p.payment_method || <span className="text-gray-400">—</span>}
                  {p.payment_attempts > 1 && (
                    <span className="ml-1 text-[10px] text-gray-500" title={`${p.payment_attempts} payment attempts`}>
                      ×{p.payment_attempts}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">{p.currency || <span className="text-gray-400">—</span>}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}`}>
                    {p.status === 'unpaid' ? 'not started' : p.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                  {formatDate(p.activity_at || p.paid_at || p.created_at)}
                </td>
                <td className="py-3 px-4">
                  {p.id ? (
                    <button
                      className="text-navy hover:text-gold text-xs font-semibold underline disabled:opacity-50"
                      disabled={pdfRowId === p.id}
                      onClick={() => downloadReceipt(p)}
                    >
                      {pdfRowId === p.id ? '…' : 'PDF'}
                    </button>
                  ) : (
                    <span className="text-gray-300 text-xs" title="No payment record to receipt">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
        <span>{total} total registrations</span>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button className="btn-outline py-1 px-3 text-xs" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
          <span className="py-1 px-3 whitespace-nowrap">Page {page} of {totalPages}</span>
          <button className="btn-outline py-1 px-3 text-xs" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
