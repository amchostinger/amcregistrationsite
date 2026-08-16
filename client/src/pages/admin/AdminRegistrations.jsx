/**
 * pages/admin/AdminRegistrations.jsx
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminRegistrations } from '../../hooks/useAdmin';
import { adminApi } from '../../lib/api';
import { downloadBlob } from '../../lib/utils';
import RegistrationsTable from '../../components/admin/RegistrationsTable';

export default function AdminRegistrations() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  const { registrations, total, totalPages, loading, error, load } = useAdminRegistrations();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleSearch = (params) => {
    setFilters(params);
    load({ ...params, page: 1 });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    load({ ...filters, page: newPage });
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await adminApi.updateStatus(id, newStatus);
      toast.success('Status updated.');
      load({ ...filters, page });
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleExportCsv = async () => {
    try {
      // Export exactly what the current filters select, not the whole table.
      const { page: _page, ...exportFilters } = filters;
      const { data } = await adminApi.exportCsv(exportFilters);
      downloadBlob(data, `amc2027-registrations-${Date.now()}.csv`);
      toast.success('CSV exported.');
    } catch {
      toast.error('Export failed.');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">Registrations</h2>
          <p className="text-gray-500 text-sm">{total} total registrations</p>
        </div>
        <button onClick={handleExportCsv} className="btn-primary py-2 px-4 text-sm">
          Export CSV
        </button>
      </div>

      <RegistrationsTable
        registrations={registrations}
        total={total}
        totalPages={totalPages}
        page={page}
        loading={loading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
