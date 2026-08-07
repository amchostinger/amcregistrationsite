/**
 * components/admin/DashboardStats.jsx
 * Stats cards + charts for the admin dashboard.
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, getStatusBadgeClass } from '../../lib/utils';

const CHART_COLORS = ['#1e3a5f', '#c9a84c', '#4a7eb5', '#e8c663', '#7e9fbe'];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-heading font-bold ${accent ? 'text-gold-600' : 'text-navy'}`}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardStats({ stats }) {
  if (!stats) return null;

  const pieData = (stats.byCategory || []).map((r) => ({
    name: r.category,
    value: Number(r.count),
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Registrations" value={stats.totalRegistrations} />
        <StatCard label="Confirmed (Paid)" value={stats.confirmedCount} sub="Fully confirmed" />
        <StatCard label="Pending Payment" value={stats.pendingCount} sub="Awaiting payment" />
        <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} accent />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="card">
          <h3 className="font-heading font-semibold text-navy mb-4">By Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">No data yet.</p>
          )}
        </div>

        {/* By Country */}
        <div className="card">
          <h3 className="font-heading font-semibold text-navy mb-4">Top Countries</h3>
          <div className="space-y-2 overflow-y-auto max-h-52">
            {(stats.byCountry || []).slice(0, 10).map((r) => (
              <div key={r.country} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{r.country || 'Unknown'}</span>
                <span className="font-semibold text-navy">{r.count}</span>
              </div>
            ))}
            {!stats.byCountry?.length && <p className="text-gray-400 text-sm">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="card">
        <h3 className="font-heading font-semibold text-navy mb-4">Recent Registrations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Ref','Name','Category','Country','Status','Payment'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats.recentRegistrations || []).map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs text-navy">{r.registration_ref}</td>
                  <td className="py-2 px-3">{r.designation} {r.first_name} {r.last_name}</td>
                  <td className="py-2 px-3">{r.category}</td>
                  <td className="py-2 px-3">{r.country}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(r.registration_status)}`}>
                      {r.registration_status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(r.payment_status)}`}>
                      {r.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
              {!stats.recentRegistrations?.length && (
                <tr><td colSpan={6} className="py-4 text-center text-gray-400 text-sm">No registrations yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
