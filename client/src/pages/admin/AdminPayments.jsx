/**
 * pages/admin/AdminPayments.jsx
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminPayments } from '../../hooks/useAdmin';
import PaymentsTable from '../../components/admin/PaymentsTable';

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

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

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-navy">Payments</h2>
        <p className="text-gray-500 text-sm">{total} payment records</p>
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
