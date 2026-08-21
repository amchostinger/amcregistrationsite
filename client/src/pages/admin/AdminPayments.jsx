/**
 * pages/admin/AdminPayments.jsx
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminPayments } from '../../hooks/useAdmin';
import { adminApi } from '../../lib/api';
import { downloadBlob, downloadErrorMessage } from '../../lib/utils';
import PaymentsTable from '../../components/admin/PaymentsTable';

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [exporting, setExporting] = useState(false);

  const { payments, total, totalPages, loading, error, load } = useAdminPayments();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleFilter = (params) => {
    setFilters(params);
    load({ ...params, page: 1 });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    load({ ...filters, page: newPage });
  };

  // Covers exactly what the current filters select, not just the visible page.
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const { page: _page, ...exportFilters } = filters;
      const { data } = await adminApi.paymentsPdf(exportFilters);
      downloadBlob(data, `amc2027-payments-${Date.now()}.pdf`);
      toast.success('PDF exported.');
    } catch (err) {
      toast.error(await downloadErrorMessage(err, 'Export failed.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">Payments</h2>
          <p className="text-gray-500 text-sm">{total} payment records</p>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
        >
          {exporting ? 'Building…' : 'Export PDF'}
        </button>
      </div>

      <PaymentsTable
        payments={payments}
        total={total}
        totalPages={totalPages}
        page={page}
        loading={loading}
        onFilter={handleFilter}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
