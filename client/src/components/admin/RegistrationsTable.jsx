/**
 * components/admin/RegistrationsTable.jsx
 * Paginated, searchable, filterable registrations data table.
 */

import { useState } from 'react';
import { getStatusBadgeClass, formatCurrency, formatDate } from '../../lib/utils';
import AttendeeModal from './AttendeeModal';

export default function RegistrationsTable({ registrations, total, totalPages, page, loading, onSearch, onFilter, onPageChange, onStatusUpdate, onResendEmail }) {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ search, status: statusFilter, category: categoryFilter, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    const next = { search, status: statusFilter, category: categoryFilter, page: 1, [key]: value };
    if (key === 'status') setStatusFilter(value);
    if (key === 'category') setCategoryFilter(value);
    onSearch(next);
  };

  return (
    <div className="space-y-4">
      {/* Search + Filter Bar */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[200px]"
          placeholder="Search name, email, ref…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input w-40"
          value={statusFilter}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="form-input w-44"
          value={categoryFilter}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Delegate">Delegate</option>
          <option value="Invited Guest">Invited Guest</option>
          <option value="Observer">Observer</option>
        </select>
        <button type="submit" className="btn-primary py-2 px-4">Search</button>
      </form>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
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
              <tr><td colSpan={11} className="py-8 text-center text-gray-400">No registrations found.</td></tr>
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
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{total} total registrations</span>
        <div className="flex gap-2">
          <button
            className="btn-outline py-1 px-3 text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ← Prev
          </button>
          <span className="py-1 px-3">Page {page} of {totalPages}</span>
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
