/**
 * components/admin/PaymentsTable.jsx
 */

import { formatCurrency, formatDate, getStatusBadgeClass } from '../../lib/utils';

export default function PaymentsTable({ payments, total, totalPages, page, loading, onFilter, onPageChange }) {
  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-3">
        <select
          className="form-input w-44"
          onChange={(e) => onFilter({ status: e.target.value, page: 1 })}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Ref','Name','Category','Paid','Total Due','Balance','Method','Currency','Status','Date'].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="py-8 text-center text-gray-400">Loading…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={10} className="py-8 text-center text-gray-400">No payments found.</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs text-navy font-semibold">{p.registration_ref}</td>
                <td className="py-3 px-4 whitespace-nowrap">{p.designation} {p.first_name} {p.last_name}</td>
                <td className="py-3 px-4">{p.category}</td>
                <td className="py-3 px-4 font-semibold">{formatCurrency(p.amount)}</td>
                <td className="py-3 px-4 font-semibold">{formatCurrency(p.grand_total || 0)}</td>
                <td className="py-3 px-4 font-semibold text-red-600">{formatCurrency((p.grand_total || 0) - (p.amount || 0))}</td>
                <td className="py-3 px-4 capitalize">{p.payment_method}</td>
                <td className="py-3 px-4">{p.currency}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}`}>
                    {p.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{total} total payments</span>
        <div className="flex gap-2">
          <button className="btn-outline py-1 px-3 text-xs" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
          <span className="py-1 px-3">Page {page} of {totalPages}</span>
          <button className="btn-outline py-1 px-3 text-xs" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
