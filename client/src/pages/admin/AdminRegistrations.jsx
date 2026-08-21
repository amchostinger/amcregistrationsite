/**
 * pages/admin/AdminRegistrations.jsx
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminRegistrations } from '../../hooks/useAdmin';
import { adminApi } from '../../lib/api';
import { downloadBlob, downloadErrorMessage } from '../../lib/utils';
import RegistrationsTable from '../../components/admin/RegistrationsTable';

export default function AdminRegistrations() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [exporting, setExporting] = useState(null);

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

  // Every export covers exactly what the current filters select, not the whole
  // table — the page number is dropped so it spans all matching pages.
  const exportFilters = () => {
    const { page: _page, ...rest } = filters;
    return rest;
  };

  const handleExportCsv = async () => {
    setExporting('csv');
    try {
      const { data } = await adminApi.exportCsv(exportFilters());
      downloadBlob(data, `amc2027-registrations-${Date.now()}.csv`);
      toast.success('CSV exported.');
    } catch (err) {
      toast.error(await downloadErrorMessage(err, 'Export failed.'));
    } finally {
      setExporting(null);
    }
  };

  /**
   * @param {boolean} detailed — append a full record page per registrant after
   *   the summary listing, rather than the listing alone.
   */
  const handleExportPdf = async (detailed) => {
    setExporting(detailed ? 'pdf-detailed' : 'pdf');
    try {
      const { data } = await adminApi.registrationsPdf({ ...exportFilters(), detailed });
      downloadBlob(data, `amc2027-registrations-${detailed ? 'detailed-' : ''}${Date.now()}.pdf`);
      toast.success('PDF exported.');
    } catch (err) {
      toast.error(await downloadErrorMessage(err, 'Export failed.'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">Registrations</h2>
          <p className="text-gray-500 text-sm">{total} total registrations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!!exporting}
            className="btn-outline py-2 px-4 text-sm disabled:opacity-50"
          >
            {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExportPdf(false)}
            disabled={!!exporting}
            className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
          >
            {exporting === 'pdf' ? 'Building…' : 'Export PDF'}
          </button>
          <button
            onClick={() => handleExportPdf(true)}
            disabled={!!exporting}
            title="Summary listing plus a full record page for every registrant"
            className="btn-outline py-2 px-4 text-sm disabled:opacity-50"
          >
            {exporting === 'pdf-detailed' ? 'Building…' : 'Full PDF Pack'}
          </button>
        </div>
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
