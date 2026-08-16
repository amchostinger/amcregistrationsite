/**
 * pages/admin/AdminDashboard.jsx
 */

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminStats } from '../../hooks/useAdmin';
import { adminApi } from '../../lib/api';
import { downloadBlob } from '../../lib/utils';
import DashboardStats from '../../components/admin/DashboardStats';

export default function AdminDashboard() {
  const { stats, loading, error, refresh } = useAdminStats();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleExportCsv = async () => {
    try {
      const { data } = await adminApi.exportCsv();
      downloadBlob(data, `amc2027-registrations-${Date.now()}.csv`);
      toast.success('CSV exported successfully.');
    } catch {
      toast.error('Export failed.');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">Dashboard</h2>
          <p className="text-gray-500 text-sm">AMC 2027 Conference Overview</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} className="btn-outline py-2 px-4 text-sm">
            Refresh
          </button>
          <button onClick={handleExportCsv} className="btn-primary py-2 px-4 text-sm">
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-10 h-10 text-navy" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : (
        <DashboardStats stats={stats} />
      )}
    </div>
  );
}
