/**
 * components/admin/RegistrationsTable.jsx
 * Paginated, searchable, filterable registrations data table.
 *
 * Filtering happens server-side (the list is paginated), so every control here
 * pushes a fresh query up through onSearch. Search is debounced; dropdowns and
 * dates apply immediately.
 */

import { useState, useEffect, useRef } from 'react';
import { getStatusBadgeClass, formatCurrency, formatDate } from '../../lib/utils';
import FilterBar from './FilterBar';
import AttendeeModal from './AttendeeModal';

const BLANK = { search: '', status: '', category: '', payment_status: '', date_from: '', date_to: '' };

export default function RegistrationsTable({
  registrations, total, totalPages, page, loading,
  onSearch, onPageChange, onStatusUpdate, onResendEmail,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState(BLANK);

  // Typing shouldn't fire a request per keystroke.
  const debounce = useRef(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => onSearch({ ...filters, page: 1 }), 350);
    return () => clearTimeout(debounce.current);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const active = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      <FilterBar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search name, email, ref, phone, church or country…"
        selects={[
          {
            label: 'Registration status',
            value: filters.status,
            onChange: (v) => setFilter('status', v),
            options: [
              { value: '', label: 'All statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
            ],
          },
          {
            label: 'Payment status',
            value: filters.payment_status,
            onChange: (v) => setFilter('payment_status', v),
            options: [
              { value: '', label: 'All payments' },
              { value: 'pending', label: 'Payment pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
            ],
          },
          {
            label: 'Category',
            value: filters.category,
            onChange: (v) => setFilter('category', v),
            options: [
              { value: '', label: 'All categories' },
              { value: 'Delegate', label: 'Delegate' },
              { value: 'Invited Guest', label: 'Invited Guest' },
              { value: 'Observer', label: 'Observer' },
            ],
          },
        ]}
        dateRange={{
          label: 'Registered',
          from: filters.date_from,
          to: filters.date_to,
          onFromChange: (v) => setFilter('date_from', v),
          onToChange: (v) => setFilter('date_to', v),
        }}
        active={active}
        onReset={() => setFilters(BLANK)}
        summary={active ? `${total} registrations match these filters` : `${total} registrations`}
      />

      {/* Table — scrolls sideways on narrow screens rather than squashing */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[56rem]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Ref','Name','Designation','Category','Country','Total','Balance','Status','Payment','Date','Actions'].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="py-8 text-center text-gray-400">Loading…</td></tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400">
                  {active ? 'No registrations match these filters.' : 'No registrations found.'}
                </td>
              </tr>
            ) : registrations.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-navy font-semibold">{r.registration_ref}</td>
                <td className="py-3 px-4 whitespace-nowrap">{r.first_name} {r.last_name}</td>
                <td className="py-3 px-4 text-gray-600">{r.designation}</td>
                <td className="py-3 px-4">{r.category}</td>
                <td className="py-3 px-4">{r.country}</td>
                <td className="py-3 px-4 font-semibold">{formatCurrency(r.grand_total || 0)}</td>
                <td className="py-3 px-4 font-semibold text-red-600">{formatCurrency(r.balance_due || 0)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(r.registration_status)}`}>
                    {r.registration_status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(r.payment_status)}`}>
                    {r.payment_status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="py-3 px-4">
                  <button
                    className="text-navy hover:text-gold text-xs font-semibold underline"
                    onClick={() => setSelectedId(r.id)}
                  >
                    View
                  </button>
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
          <button
            className="btn-outline py-1 px-3 text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ← Prev
          </button>
          <span className="py-1 px-3 whitespace-nowrap">Page {page} of {totalPages}</span>
          <button
            className="btn-outline py-1 px-3 text-xs"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedId && (
        <AttendeeModal
          registrantId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusUpdate={onStatusUpdate}
          onResendEmail={onResendEmail}
        />
      )}
    </div>
  );
}
